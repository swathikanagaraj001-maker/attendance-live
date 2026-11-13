// Demo auth: email + password, plus fingerprint / face unlock via WebAuthn.
// Accounts live in this browser's localStorage (no server).
import { useSyncExternalStore } from "react";

const USERS_KEY = "attendance:users:v1";
const SESSION_KEY = "attendance:session:v1";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const normEmail = (e) => e.trim().toLowerCase();

let session = read(SESSION_KEY, null);
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
export const useSession = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => session, () => session);

export function startSession(user) {
  session = { email: user.email, role: user.role };
  write(SESSION_KEY, session);
  emit();
}
export function logout() {
  session = null;
  try { localStorage.removeItem(SESSION_KEY); } catch {}
  emit();
}

async function hashPassword(password, saltB64) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations: 100000, hash: "SHA-256" }, key, 256);
  return toB64(bits);
}

export async function register({ email, password, role }) {
  email = normEmail(email);
  const users = read(USERS_KEY, []);
  if (users.some((u) => u.email === email)) throw new Error("This email is already registered. Sign in instead.");
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const user = { email, role, salt, passHash: await hashPassword(password, salt), credentialId: null };
  write(USERS_KEY, [...users, user]);
  return user;
}

export async function login({ email, password }) {
  const user = read(USERS_KEY, []).find((u) => u.email === normEmail(email));
  if (!user || (await hashPassword(password, user.salt)) !== user.passHash) throw new Error("Wrong email or password.");
  return user;
}

export async function biometricSupported() {
  try {
    return !!(window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()));
  } catch { return false; }
}
export const hasBiometric = (email) =>
  !!read(USERS_KEY, []).find((u) => u.email === normEmail(email))?.credentialId;

export async function enrollBiometric(email) {
  email = normEmail(email);
  const users = read(USERS_KEY, []);
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error("Account not found.");
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "Attendance" },
      user: { id: new TextEncoder().encode(email).slice(0, 64), name: email, displayName: email },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60000,
    },
  });
  user.credentialId = toB64(cred.rawId);
  write(USERS_KEY, users);
  return user;
}

export async function biometricLogin(email) {
  const user = read(USERS_KEY, []).find((u) => u.email === normEmail(email));
  if (!user?.credentialId) throw new Error("Fingerprint / face unlock isn't set up for this email on this device. Sign in with your password first.");
  await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: "public-key", id: fromB64(user.credentialId), transports: ["internal"] }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  return user;
}
