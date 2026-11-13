import { useEffect, useRef } from "react";
import { checkGeofence } from "./geofence";
import { getState, addAlert } from "../store/appStore";

// While clocked in, alerts the manager once when the employee leaves the radius.
export default function useGeofenceMonitor({ clockedIn, employee }) {
  const wasInside = useRef(true);
  useEffect(() => {
    if (!clockedIn || !("geolocation" in navigator)) return;
    wasInside.current = true;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const r = checkGeofence(pos.coords, getState().offices);
        if (!r) return;
        if (!r.verified && wasInside.current) {
          addAlert({ type: "left_radius", employee, office: r.office.name, distanceKm: r.distanceKm, radiusKm: r.radiusKm });
        }
        wasInside.current = r.verified;
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [clockedIn, employee]);
}
