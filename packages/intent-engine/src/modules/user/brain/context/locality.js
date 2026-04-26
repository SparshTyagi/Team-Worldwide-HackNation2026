"use strict";

function quantize(num, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

function pseudoCellFromLatLon(lat, lon, precision = 2) {
  return `${quantize(lat, precision)}:${quantize(lon, precision)}`;
}

function buildLocalityLimiter({
  lat,
  lon,
  radius_km = 2,
  include_area_cells = true,
  nearby_merchant_ids = [],
}) {
  const locality = { radius_km };
  if (include_area_cells && Number.isFinite(lat) && Number.isFinite(lon)) {
    const core = pseudoCellFromLatLon(lat, lon, 2);
    const north = pseudoCellFromLatLon(lat + 0.01, lon, 2);
    const east = pseudoCellFromLatLon(lat, lon + 0.01, 2);
    locality.area_cell_ids = [core, north, east];
  }
  if (Array.isArray(nearby_merchant_ids) && nearby_merchant_ids.length > 0) {
    locality.nearby_merchant_ids = nearby_merchant_ids;
  }
  return locality;
}

module.exports = { buildLocalityLimiter };
