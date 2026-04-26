"use strict";

function toDayType(now) {
  const day = now.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

function toTimeBucket(hour) {
  if (hour < 11) return "morning";
  if (hour < 14) return "lunch";
  if (hour < 18) return "afternoon";
  return "evening";
}

function inferMobilityMode(speedMps) {
  if (speedMps >= 6) return "transit";
  if (speedMps >= 0.6) return "walking";
  return "stationary";
}

function collectContext({
  now = new Date(),
  speed_mps = 0,
  stop_count_15m = 0,
  distance_preference = "under_5_min",
  weather_summary = "unknown",
  temperature_c = null,
  event_intensity = "low",
  events = [],
}) {
  const hour = now.getHours();
  return {
    now_utc: now.toISOString(),
    local_hour: hour,
    day_type: toDayType(now),
    time_bucket: toTimeBucket(hour),
    speed_mps,
    movement_state: inferMobilityMode(speed_mps),
    stop_count_15m,
    distance_preference,
    weather_summary,
    temperature_c: Number.isFinite(Number(temperature_c)) ? Number(temperature_c) : null,
    event_intensity,
    events: Array.isArray(events) ? events : [],
  };
}

module.exports = {
  collectContext,
  inferMobilityMode,
};
