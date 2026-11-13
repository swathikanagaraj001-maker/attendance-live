// One shared store: offices, tasks, leaves, alerts and per-user attendance.
// Saved in localStorage; updates other open tabs of the same browser too.
import { useSyncExternalStore } from "react";

const KEY = "attendance:data:v2";
const fresh = () => ({ offices: [], tasks: [], leaves: [], alerts: [], attendance: {} });
const load = () => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return fresh(); } };

let state = load();
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
function set(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  emit();
}
window.addEventListener("storage", (e) => { if (e.key === KEY) { state = load(); emit(); } });

export const getState = () => state;
export const useStore = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, getState, getState);

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const dayKey = (d) => `${monthKey(d)}-${pad(d.getDate())}`;

// ---- attendance (per user, resets each month) ----
export const attendanceOf = (st, email) => {
  const a = st.attendance[email];
  if (a && a.month === monthKey()) return a;
  return { month: monthKey(), active: a?.active || null, logs: [], days: [] };
};
const setAtt = (email, a) => set({ ...state, attendance: { ...state.attendance, [email]: a } });

export function clockIn(email) {
  const a = attendanceOf(state, email);
  if (a.active) return;
  setAtt(email, { ...a, active: { start: Date.now() } });
}
export function clockOut(email) {
  const a = attendanceOf(state, email);
  if (!a.active) return;
  const end = Date.now();
  const start = a.active.start;
  const d = dayKey(new Date(end));
  setAtt(email, {
    ...a,
    active: null,
    logs: [...a.logs, { start, end, durationMs: end - start }],
    days: a.days.includes(d) ? a.days : [...a.days, d], // one working day per date
  });
}

// ---- offices ----
export const addOffice = (o) => set({ ...state, offices: [...state.offices, { id: uid(), ...o }] });
export const removeOffice = (id) => set({ ...state, offices: state.offices.filter((o) => o.id !== id) });

// ---- tasks ----
export const addTask = (t) => set({ ...state, tasks: [{ id: uid(), status: "Pending", ...t }, ...state.tasks] });
export const toggleTask = (id) =>
  set({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: t.status === "Pending" ? "Completed" : "Pending" } : t)) });

// ---- leaves ----
export const addLeave = (l) => set({ ...state, leaves: [{ id: uid(), status: "Pending", ...l }, ...state.leaves] });
export const decideLeave = (id, status) =>
  set({ ...state, leaves: state.leaves.map((l) => (l.id === id ? { ...l, status } : l)) });

// ---- location alerts ----
export const addAlert = (a) => set({ ...state, alerts: [{ id: uid(), time: Date.now(), ...a }, ...state.alerts].slice(0, 100) });
export const dismissAlert = (id) => set({ ...state, alerts: state.alerts.filter((a) => a.id !== id) });
export const clearAlerts = () => set({ ...state, alerts: [] });

export const resetAll = () => set(fresh());
