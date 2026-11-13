import { useCallback, useEffect, useState } from "react";
import { useStore, getState, addAlert } from "../store/appStore";
import { checkGeofence, getCurrentCoords } from "../utils/geofence";
import useGeofenceMonitor from "../utils/useGeofenceMonitor";
import { useAttendance } from "../hooks/useAttendance";

export default function LocationCard({ email, onResult }) {
  useStore();
  const { active } = useAttendance(email);
  useGeofenceMonitor({ clockedIn: !!active, employee: email });

  const [status, setStatus] = useState("locating"); // locating | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const verify = useCallback(async () => {
    setStatus("locating");
    setError("");
    onResult?.(null);
    try {
      if (!getState().offices.length) throw new Error("No office is set up yet. Ask the admin to add one in the Manager desk.");
      const check = checkGeofence(await getCurrentCoords(), getState().offices);
      setResult(check);
      setStatus("done");
      onResult?.(check);
      if (!check.verified) {
        addAlert({ type: "outside_at_check", employee: email, office: check.office.name, distanceKm: check.distanceKm, radiusKm: check.radiusKm });
      }
    } catch (e) {
      setError(e.message);
      setStatus("error");
      setResult(null);
    }
  }, [email, onResult]);

  useEffect(() => { verify(); }, []); // check once when the page opens

  return (
    <section className="rounded-2xl border border-blue-800/60 bg-[#0f2547] p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Location check</h2>
        {status === "done" && result && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.verified ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
            {result.verified ? "Verified" : "Rejected"}
          </span>
        )}
      </div>
      {active && <p className="mt-2 text-xs text-emerald-300">Live tracking is on while you are clocked in.</p>}

      {status === "locating" && <p className="mt-5 text-sm text-blue-300/70">Getting your position…</p>}
      {status === "error" && <p role="alert" className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {status === "done" && result && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-blue-300/70">Office branch</dt><dd className="mt-0.5 text-white">{result.office.name}</dd></div>
            <div><dt className="text-blue-300/70">Distance</dt><dd className="mt-0.5 text-white">{result.distanceKm.toFixed(2)} km</dd></div>
            <div><dt className="text-blue-300/70">Office Wi-Fi</dt><dd className="mt-0.5 text-white">{result.office.wifi || "—"}</dd></div>
            <div><dt className="text-blue-300/70">Allowed radius</dt><dd className="mt-0.5 text-white">{result.radiusKm.toFixed(1)} km</dd></div>
          </dl>
          {!result.verified && (
            <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              You are {result.distanceKm.toFixed(2)} km from {result.office.name}, beyond the {result.radiusKm.toFixed(1)} km limit. The office admin has been alerted.
            </p>
          )}
        </>
      )}

      <button type="button" onClick={verify} disabled={status === "locating"}
        className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50">
        Check again
      </button>
    </section>
  );
}
