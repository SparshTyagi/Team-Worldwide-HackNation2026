"use strict";

class BrainMetrics {
  constructor() {
    this.events = [];
  }

  record(name, value, tags = {}) {
    this.events.push({
      name,
      value,
      tags,
      timestamp_utc: new Date().toISOString(),
    });
  }

  summary(name) {
    const points = this.events.filter((event) => event.name === name).map((event) => event.value);
    if (points.length === 0) return null;
    const sorted = [...points].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return {
      count: points.length,
      p50,
      p95,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  dump() {
    return [...this.events];
  }
}

module.exports = { BrainMetrics };
