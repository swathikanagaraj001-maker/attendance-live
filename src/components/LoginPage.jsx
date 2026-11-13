import { useEffect, useState } from "react";
import { register, login, startSession, biometricSupported, hasBiometric, enrollBiometric, biometricLogin } from "../store/authStore";
import { assertAtOffice } from "../utils/loginGuard";

const input = "w-full rounded-lg border border-blue-800/60 bg-[#14306a] px-3 py-2.5 text-sm text-white placeholder-blue-300/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
const primary = "w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50";

const friendly = (e) =>
  e?.name === "NotAllowedError" ? "Cancelled, or the fingerprint / face wasn't recognised. Try again."
  : e?.name === "InvalidStateError" ? "This device is already registered for this account."
  : e?.message || "Something went wrong.";

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bioOk, setBioOk] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => { biometricSupported().then(setBioOk); }, []);

  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  };

  const finish = async (user) => {
    await assertAtOffice(user); // employees must be inside an office radius
    if (bioOk && !user.credentialId) { setPending(user); setStep("offer"); }
    else startSession(user);
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (mode === "signup" && password.length < 6) throw new Error("Password must be at least 6 characters.");
      await finish(mode === "signup" ? await register({ email, password, role }) : await login({ email, password }));
    });
  };
  const useBiometric = () => run(async () => {
    if (!email.trim()) throw new Error("Type your email first, then tap fingerprint / face unlock.");
    const user = await biometricLogin(email);
    await assertAtOffice(user);
    startSession(user);
  });
  const enable = () => run(async () => { startSession(await enrollBiometric(pending.email)); });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-blue-800/60 bg-[#0f2547] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-white">Attendance</h1>

        {step === "offer" ? (
          <div className="mt-4">
            <p className="text-sm text-blue-100">Sign in faster next time with your fingerprint or face unlock on this device?</p>
            {error && <p role="alert" className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button type="button" onClick={enable} disabled={busy} className={`${primary} mt-5`}>{busy ? "Waiting for device…" : "Enable fingerprint / face unlock"}</button>
            <button type="button" onClick={() => startSession(pending)} className="mt-3 w-full text-sm text-blue-300 hover:text-white">Not now</button>
          </div>
        ) : (
          <>
            <div role="tablist" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#0a1a3a] p-1 text-sm">
              {[["signin", "Sign in"], ["signup", "Create account"]].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setError(""); }}
                  className={`rounded-lg py-2 transition ${mode === id ? "bg-blue-600 text-white" : "text-blue-200 hover:bg-blue-800/50"}`}>{label}</button>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div><label htmlFor="email" className="mb-1 block text-xs text-blue-300/80">Email</label>
                <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={input} /></div>
              <div><label htmlFor="password" className="mb-1 block text-xs text-blue-300/80">Password</label>
                <input id="password" type="password" required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={input} /></div>
              {mode === "signup" && (
                <div><label htmlFor="role" className="mb-1 block text-xs text-blue-300/80">I am a</label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className={input}>
                    <option value="employee">Employee</option><option value="manager">Manager</option></select></div>
              )}
              {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy} className={primary}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
            </form>
            {mode === "signin" && bioOk && (
              <>
                <div className="my-4 flex items-center gap-3 text-xs text-blue-300/60"><span className="h-px flex-1 bg-blue-800/60" />or<span className="h-px flex-1 bg-blue-800/60" /></div>
                <button type="button" onClick={useBiometric} disabled={busy}
                  className="w-full rounded-xl border border-blue-500/60 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50">
                  Use fingerprint / face unlock</button>
                {email && !hasBiometric(email) && <p className="mt-2 text-xs text-blue-300/60">Set this up after your first password sign-in.</p>}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
