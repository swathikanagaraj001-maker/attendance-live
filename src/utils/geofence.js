export const DEFAULT_RADIUS_KM = 2.0;
const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km (Haversine). */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Nearest office + whether it is inside that office's radius (default 2.0 km). */
export function checkGeofence(coords, offices) {
  if (!offices?.length) return null;
  const m = offices
    .map((office) => ({ office, distanceKm: haversineKm(coords.latitude, coords.longitude, office.lat, office.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  const radiusKm = m.office.radiusKm ?? DEFAULT_RADIUS_KM;
  return { ...m, radiusKm, verified: m.distanceKm <= radiusKm };
}

export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Geolocation is not supported by this browser."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      (e) => reject(new Error({
        1: "Location permission was denied. Allow location access and try again.",
        2: "Your position could not be determined. Check your GPS or network.",
        3: "Location request timed out. Try again.",
      }[e.code] || e.message)),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
    );
  });
}
