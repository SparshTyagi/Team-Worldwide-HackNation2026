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

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMerchantId(merchant) {
  return (
    merchant?.merchant_id ||
    merchant?.business_hours?.external_merchant_id ||
    merchant?.id ||
    null
  );
}

function resolveAreaCellId(merchant) {
  return merchant?.area_cell_id || merchant?.business_hours?.area_cell_id || null;
}

function resolveCoords(merchant) {
  const lat = toFiniteNumber(merchant?.lat ?? merchant?.business_hours?.lat);
  const lon = toFiniteNumber(merchant?.lon ?? merchant?.business_hours?.lon);
  if (lat === null || lon === null) return null;
  return { lat, lon };
}

export function filterMerchantsByLocality(merchants, locality, fallbackRadiusKm = 2) {
  if (!locality) return merchants;

  const radiusKm = Number(locality.radius_km || fallbackRadiusKm);

  if (Array.isArray(locality.nearby_merchant_ids) && locality.nearby_merchant_ids.length) {
    const allowed = new Set(locality.nearby_merchant_ids);
    return merchants.filter((m) => {
      const merchantId = resolveMerchantId(m);
      return merchantId ? allowed.has(merchantId) : false;
    });
  }

  if (Array.isArray(locality.area_cell_ids) && locality.area_cell_ids.length) {
    const allowed = new Set(locality.area_cell_ids);
    return merchants.filter((m) => {
      const areaCellId = resolveAreaCellId(m);
      return areaCellId ? allowed.has(areaCellId) : false;
    });
  }

  if (Array.isArray(locality.path_waypoints) && locality.path_waypoints.length) {
    const bufferMeters = Number(locality.buffer_radius_meters || radiusKm * 1000);
    return merchants.filter((m) => {
      const coords = resolveCoords(m);
      if (!coords) return false;
      return locality.path_waypoints.some((wp) => {
        const distKm = haversineDistanceKm(coords, wp);
        return distKm * 1000 <= bufferMeters;
      });
    });
  }

  if (locality.center && typeof locality.center.lat === "number" && typeof locality.center.lon === "number") {
    return merchants.filter((m) => {
      const coords = resolveCoords(m);
      if (!coords) return false;
      const distKm = haversineDistanceKm(coords, {
        lat: locality.center.lat,
        lon: locality.center.lon,
      });
      return distKm <= radiusKm;
    });
  }

  return merchants;
}
