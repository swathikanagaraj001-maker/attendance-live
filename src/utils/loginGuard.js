import { checkGeofence, getCurrentCoords } from "./geofence";
import { getState, addAlert } from "../store/appStore";

// Employees may only sign in inside an office radius. Managers are exempt.
export async function assertAtOffice(user) {
  if (user.role === "manager") return;
  const offices = getState().offices;
  if (!offices.length) throw new Error("No office is set up yet. Ask your manager to add one.");
  const r = checkGeofence(await getCurrentCoords(), offices);
  if (!r.verified) {
    addAlert({ type: "login_blocked", employee: user.email, office: r.office.name, distanceKm: r.distanceKm, radiusKm: r.radiusKm });
    throw new Error(`You're ${r.distanceKm.toFixed(2)} km from ${r.office.name}. You can only sign in within ${r.radiusKm} km of the office. Your manager has been alerted.`);
  }
}
