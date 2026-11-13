import { useEffect, useState } from "react";
import { useSession, logout } from "./store/authStore";
import LoginPage from "./components/LoginPage";
import OverallMetrics from "./components/OverallMetrics";
import DutyConsole from "./components/DutyConsole";
import LocationCard from "./components/LocationCard";
import ManagerDesk from "./components/ManagerDesk";

export default function App() {
  const session = useSession();
  const isManager = session?.role === "manager";
  const [tab, setTab] = useState("employee");
  const [geo, setGeo] = useState(null);

  // Managers land on the Manager desk, employees on the Employee page.
  useEffect(() => { if (session) setTab(isManager ? "manager" : "employee"); }, [session?.email]);

  if (!session) return <LoginPage />;

  const active = isManager ? tab : "employee";
  const tabClass = (id) =>
    `rounded-lg px-4 py-2 text-sm transition ${
      active === id
        ? "bg-gradient-to-r from-blue-500 to-violet-600 text-white"
        : "bg-white/[0.07] text-indigo-100 hover:bg-white/10"
    }`;

  return (
    <div className="min-h-screen p-4 text-white sm:p-6">
      <header className="mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold">A</span>
          <div>
            <p className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-lg font-semibold leading-tight text-transparent">Attendance</p>
            <p className="text-xs text-indigo-200/60">{isManager ? "Manager console" : "Employee workspace"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex gap-2">
            <button onClick={() => setTab("employee")} className={tabClass("employee")}>Employee</button>
            {isManager && <button onClick={() => setTab("manager")} className={tabClass("manager")}>Manager</button>}
          </div>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3 text-indigo-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold uppercase text-white">{session.email[0]}</span>
            {session.email}
          </span>
          <button onClick={logout} className="rounded-lg border border-red-400/50 px-3 py-1.5 text-red-300 transition hover:bg-red-500/10">Log out</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl">
        {active === "manager" ? (
          <ManagerDesk />
        ) : (
          <div className="space-y-5">
            <OverallMetrics email={session.email} />
            <div className="grid gap-5 md:grid-cols-2">
              <DutyConsole email={session.email} locationVerified={geo ? geo.verified : null} />
              <LocationCard email={session.email} onResult={setGeo} />
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto mt-10 max-w-5xl border-t border-white/10 pt-4 text-center text-xs text-indigo-200/60">
        Powered by <span className="font-semibold text-violet-300">Foxzoid Game Studio</span>
      </footer>
    </div>
  );
}