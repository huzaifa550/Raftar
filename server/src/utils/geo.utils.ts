// Spherical Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place e.g. 3.4 km
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Ray-casting algorithm for Point in Polygon (2D Geofence)
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

// Estimated delivery ETA based on distance and average kitchen prep time
export function estimateDeliveryEta(distanceKm: number, prepTimeMinutes: number): { min: number; max: number } {
  // Assume city rider speed 20-25 km/h + 5 mins pickup buffer + traffic
  const travelTimeMinutes = Math.ceil((distanceKm / 20) * 60) + 5;
  const minTime = prepTimeMinutes + travelTimeMinutes;
  const maxTime = minTime + 15;
  return { min: minTime, max: maxTime };
}

// Format paisas (integer minor units) into PKR Rupees formatted
export function formatPKR(paisas: number): string {
  const rupees = Math.round(paisas / 100);
  return `Rs. ${rupees.toLocaleString('en-PK')}`;
}
