import { useAttendance, formatHMS, formatHM } from "../hooks/useAttendance";

function Card({ label, value, hint, live, mono }) {
  return (
    <div className="rounded-2xl border border-blue-800/60 bg-[#0f2547] p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-200/80">{label}</p>
        {live && (
          <span className="flex items-center gap-1.5 text-xs text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live
          </span>
        )}
      </div>
      <p className={`mt-3 text-3xl font-semibold text-white ${mono ? "font-mono tabular-nums" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-blue-300/60">{hint}</p>
    </div>
  );
}

export default function OverallMetrics({ email }) {
  const { todayMs, totalMs, workingDays, active } = useAttendance(email);
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Card label="Today's working hours" value={formatHMS(todayMs)} hint={active ? "Timer running" : "Clocked out"} live={!!active} mono />
      <Card label="Overall working hours" value={formatHM(totalMs)} hint="This month" />
      <Card label="Overall working days" value={workingDays} hint="Days attended this month" />
    </section>
  );
}
