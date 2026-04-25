const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function filterMerchantsByLocality(merchants, locality, fallbackRadiusKm = 2) {
  if (!locality) return merchants;

  const radiusKm = Number(locality.radius_km || fallbackRadiusKm);

  if (Array.isArray(locality.nearby_merchant_ids) && locality.nearby_merchant_ids.length) {
    const allowed = new Set(locality.nearby_merchant_ids);
    return merchants.filter((m) => allowed.has(m.merchant_id));
  }

  if (Array.isArray(locality.area_cell_ids) && locality.area_cell_ids.length) {
    const allowed = new Set(locality.area_cell_ids);
    return merchants.filter((m) => allowed.has(m.area_cell_id));
  }

  if (Array.isArray(locality.path_waypoints) && locality.path_waypoints.length) {
    const bufferMeters = Number(locality.buffer_radius_meters || radiusKm * 1000);
    return merchants.filter((m) => {
      return locality.path_waypoints.some((wp) => {
        const distKm = haversineDistanceKm({ lat: m.lat, lon: m.lon }, wp);
        return distKm * 1000 <= bufferMeters;
      });
    });
  }

  if (locality.center && typeof locality.center.lat === 'number' && typeof locality.center.lon === 'number') {
    return merchants.filter((m) => {
      const distKm = haversineDistanceKm(
        { lat: m.lat, lon: m.lon },
        { lat: locality.center.lat, lon: locality.center.lon }
      );
      return distKm <= radiusKm;
    });
  }

  return merchants;
}
