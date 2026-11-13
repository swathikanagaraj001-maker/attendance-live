import { useState } from "react";
import {
  useStore, addTask, toggleTask, addLeave, decideLeave,
  addOffice, removeOffice, dismissAlert, clearAlerts, resetAll,
} from "../store/appStore";
import { DEFAULT_RADIUS_KM, getCurrentCoords } from "../utils/geofence";

const inp = "w-full rounded-lg border border-blue-800/60 bg-[#14306a] px-3 py-2.5 text-sm text-white placeholder-blue-300/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
const btn = "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";
const ghost = "rounded-lg bg-[#1a3a7a] px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";
const pill = {
  Pending: "bg-amber-500/15 text-amber-300", Completed: "bg-emerald-500/15 text-emerald-300",
  Approved: "bg-emerald-500/15 text-emerald-300", Rejected: "bg-red-500/15 text-red-300",
};

const Panel = ({ title, aside, border = "border-blue-800/60", children }) => (
  <section className={`rounded-2xl border ${border} bg-[#0f2547] p-5 shadow-lg`}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {aside}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);
const Empty = ({ children }) => <p className="py-3 text-sm text-blue-300/70">{children}</p>;

const alertText = (a) => {
  const d = `${a.distanceKm.toFixed(2)} km`;
  if (a.type === "login_blocked") return `${a.employee} tried to sign in ${d} from ${a.office} (limit ${a.radiusKm} km)`;
  if (a.type === "left_radius") return `${a.employee} moved ${d} away from ${a.office} (limit ${a.radiusKm} km)`;
  return `${a.employee} is ${d} from ${a.office} (limit ${a.radiusKm} km)`;
};

export default function ManagerDesk() {
  const { alerts, tasks, leaves, offices } = useStore();
  const [filter, setFilter] = useState("All");
  const [task, setTask] = useState({ title: "", employee: "" });
  const [leave, setLeave] = useState({ employee: "", from: "", to: "", reason: "" });
  const [office, setOffice] = useState({ name: "", wifi: "", lat: "", lng: "", radiusKm: String(DEFAULT_RADIUS_KM) });
  const [officeErr, setOfficeErr] = useState("");

  const shown = filter === "All" ? tasks : tasks.filter((t) => t.status === filter);

  const submitOffice = (e) => {
    e.preventDefault();
    const lat = parseFloat(office.lat), lng = parseFloat(office.lng), radiusKm = parseFloat(office.radiusKm);
    if (!office.name.trim()) return setOfficeErr("Enter an office name.");
    if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return setOfficeErr("Enter a valid latitude and longitude.");
    if (!(radiusKm > 0)) return setOfficeErr("Radius must be more than 0 km.");
    addOffice({ name: office.name.trim(), wifi: office.wifi.trim(), lat, lng, radiusKm });
    setOffice({ name: "", wifi: "", lat: "", lng: "", radiusKm: String(DEFAULT_RADIUS_KM) });
    setOfficeErr("");
  };
  const useMyLocation = async () => {
    try {
      const c = await getCurrentCoords();
      setOffice((o) => ({ ...o, lat: c.latitude.toFixed(6), lng: c.longitude.toFixed(6) }));
      setOfficeErr("");
    } catch (e) { setOfficeErr(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={() => window.confirm("Delete all offices, tasks, leaves, alerts and attendance?") && resetAll()}
          className="rounded-lg border border-red-500/60 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10">Reset all data</button>
      </div>

      <Panel title={`Location alerts${alerts.length ? ` (${alerts.length})` : ""}`} border="border-red-500/40"
        aside={alerts.length > 0 && <button onClick={clearAlerts} className="text-xs text-blue-300 hover:text-white">Clear all</button>}>
        {alerts.length === 0 && <Empty>No employees are outside their office radius.</Empty>}
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-red-500/10 p-3">
              <div>
                <p className="text-sm text-red-200">{alertText(a)}</p>
                <p className="text-xs text-red-300/70">{new Date(a.time).toLocaleTimeString()}</p>
              </div>
              <button onClick={() => dismissAlert(a.id)} className={ghost}>Dismiss</button>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Task review board" aside={
          <div className="flex gap-1 text-xs">
            {["All", "Pending", "Completed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                className={`rounded-lg px-2.5 py-1 ${filter === f ? "bg-blue-600 text-white" : "bg-[#14306a] text-blue-200 hover:bg-blue-800/60"}`}>{f}</button>
            ))}
          </div>}>
          {shown.length === 0 && <Empty>No tasks yet. Add one below.</Empty>}
          <ul className="divide-y divide-blue-800/50">
            {shown.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="text-sm text-white">{t.title}</p><p className="text-xs text-blue-300/70">{t.employee}</p></div>
                <button onClick={() => toggleTask(t.id)} title="Click to change status"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pill[t.status]}`}>{t.status}</button>
              </li>
            ))}
          </ul>
          <form className="mt-4 space-y-2 border-t border-blue-800/50 pt-4"
            onSubmit={(e) => { e.preventDefault(); if (!task.title.trim() || !task.employee.trim()) return; addTask({ title: task.title.trim(), employee: task.employee.trim() }); setTask({ title: "", employee: "" }); }}>
            <p className="text-sm font-medium text-blue-100">Add task</p>
            <input className={inp} placeholder="Task title" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
            <input className={inp} placeholder="Employee name" value={task.employee} onChange={(e) => setTask({ ...task, employee: e.target.value })} />
            <button className={btn}>Add task</button>
          </form>
        </Panel>

        <Panel title="Leave approval desk">
          {leaves.length === 0 && <Empty>No leave requests yet.</Empty>}
          <ul className="divide-y divide-blue-800/50">
            {leaves.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm text-white">{l.employee}</p><p className="text-xs text-blue-300/70">{l.from} to {l.to}{l.reason && ` · ${l.reason}`}</p></div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pill[l.status]}`}>{l.status}</span>
                </div>
                {l.status === "Pending" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => decideLeave(l.id, "Approved")} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500">Approve</button>
                    <button onClick={() => decideLeave(l.id, "Rejected")} className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500">Reject</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <form className="mt-4 space-y-2 border-t border-blue-800/50 pt-4"
            onSubmit={(e) => { e.preventDefault(); if (!leave.employee.trim() || !leave.from || !leave.to) return; addLeave({ ...leave, employee: leave.employee.trim() }); setLeave({ employee: "", from: "", to: "", reason: "" }); }}>
            <p className="text-sm font-medium text-blue-100">Add leave request</p>
            <input className={inp} placeholder="Employee name" value={leave.employee} onChange={(e) => setLeave({ ...leave, employee: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className={inp} value={leave.from} onChange={(e) => setLeave({ ...leave, from: e.target.value })} />
              <input type="date" className={inp} value={leave.to} min={leave.from} onChange={(e) => setLeave({ ...leave, to: e.target.value })} />
            </div>
            <input className={inp} placeholder="Reason" value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} />
            <button className={btn}>Add request</button>
          </form>
        </Panel>
      </div>

      <Panel title="Office registry">
        {offices.length === 0 ? <Empty>No offices yet. Add your first office below.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-blue-300/70"><tr><th className="pb-2 font-medium">Branch</th><th className="pb-2 font-medium">Wi-Fi</th><th className="pb-2 font-medium">Allowed radius</th><th /></tr></thead>
              <tbody className="divide-y divide-blue-800/50 text-white">
                {offices.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5">{o.name}</td><td className="py-2.5">{o.wifi || "—"}</td><td className="py-2.5">{o.radiusKm.toFixed(1)} km</td>
                    <td className="py-2.5 text-right"><button onClick={() => removeOffice(o.id)} className="text-xs text-red-300 hover:text-red-200">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form onSubmit={submitOffice} className="mt-4 space-y-2 border-t border-blue-800/50 pt-4">
          <p className="text-sm font-medium text-blue-100">Add office</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inp} placeholder="Office name" value={office.name} onChange={(e) => setOffice({ ...office, name: e.target.value })} />
            <input className={inp} placeholder="Wi-Fi name" value={office.wifi} onChange={(e) => setOffice({ ...office, wifi: e.target.value })} />
            <input className={inp} placeholder="Latitude" inputMode="decimal" value={office.lat} onChange={(e) => setOffice({ ...office, lat: e.target.value })} />
            <input className={inp} placeholder="Longitude" inputMode="decimal" value={office.lng} onChange={(e) => setOffice({ ...office, lng: e.target.value })} />
            <input className={inp} placeholder="Radius (km)" inputMode="decimal" value={office.radiusKm} onChange={(e) => setOffice({ ...office, radiusKm: e.target.value })} />
            <button type="button" onClick={useMyLocation} className={ghost}>Use my current location</button>
          </div>
          {officeErr && <p role="alert" className="text-sm text-red-300">{officeErr}</p>}
          <button className={btn}>Add office</button>
        </form>
      </Panel>
    </div>
  );
}
