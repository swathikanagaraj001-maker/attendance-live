import { useAttendance, formatHMS } from "../hooks/useAttendance";

const fmt = (ts) => new Date(ts).toLocaleTimeString();

// locationVerified: true = inside radius, false = outside, null = still checking.
export default function DutyConsole({ email, locationVerified }) {
  const { active, runningMs, lastLog, clockIn, clockOut } = useAttendance(email);
  const blocked = !active && locationVerified !== true;

  return (
    <section className="rounded-2xl border border-blue-800/60 bg-[#0f2547] p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Shift console</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-blue-500/15 text-blue-200"}`}>
          {active ? "On duty" : "Off duty"}
        </span>
      </div>
      <p className="mt-6 text-center font-mono text-5xl tabular-nums text-white">{formatHMS(runningMs)}</p>
      <p className="mt-1 text-center text-sm text-blue-300/70">Current session</p>

      <button
        type="button"
        onClick={active ? clockOut : clockIn}
        disabled={blocked}
        className={`mt-6 w-full rounded-xl py-3 text-base font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}
      >
        {active ? "Clock out" : "Clock in"}
      </button>
      {blocked && (
        <p className="mt-3 text-center text-sm text-red-300">
          {locationVerified === false ? "You're outside the office radius, so you can't clock in." : "Checking your location…"}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-blue-800/60 pt-4 text-sm">
  <div>
    <dt className="text-blue-300/70">Clock-in time</dt>
    <dd className="mt-0.5 text-white">{active ? fmt(active.start) : lastLog ? fmt(lastLog.start) : "—"}</dd>
  </div>
  <div>
    <dt className="text-blue-300/70">Clock-out time</dt>
    <dd className="mt-0.5 text-white">{active ? "In progress" : lastLog ? fmt(lastLog.end) : "—"}</dd>
  </div>
</dl>
    </section>
  );
}
