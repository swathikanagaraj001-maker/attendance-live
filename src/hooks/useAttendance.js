import { useEffect, useState } from "react";
import { useStore, attendanceOf, clockIn, clockOut } from "../store/appStore";

const pad = (n) => String(n).padStart(2, "0");
export const formatHMS = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(pad).join(":");
};
export const formatHM = (ms) => {
  const m = Math.floor(Math.max(0, ms) / 60000);
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};

function useNow(enabled) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

export function useAttendance(email) {
  const a = attendanceOf(useStore(), email);
  const now = useNow(!!a.active);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const doneToday = a.logs.filter((l) => l.end >= startOfToday).reduce((s, l) => s + l.durationMs, 0);
  return {
    active: a.active,
    lastLog: a.logs[a.logs.length - 1] || null,
    runningMs: a.active ? Math.max(0, now - a.active.start) : 0,
    todayMs: doneToday + (a.active ? Math.max(0, now - Math.max(a.active.start, startOfToday)) : 0),
    totalMs: a.logs.reduce((s, l) => s + l.durationMs, 0),
    workingDays: a.days.length,
    clockIn: () => clockIn(email),
    clockOut: () => clockOut(email),
  };
}
