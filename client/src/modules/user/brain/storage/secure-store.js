"use strict";

/**
 * Lightweight in-memory secure store adapter.
 * In React Native production, swap this for MMKV/Keychain-backed implementation.
 */
class SecureStore {
  constructor() {
    this.store = new Map();
    const env = String(process.env.NODE_ENV || "development").toLowerCase();
    if (env === "production") {
      console.warn(
        "[SecureStore] Using in-memory store in production. Replace with encrypted persistent storage.",
      );
    }
  }

  async setItem(key, value) {
    this.store.set(key, JSON.stringify(value));
  }

  async getItem(key) {
    const raw = this.store.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async removeItem(key) {
    this.store.delete(key);
  }

  async resetPersonalization(prefix = "brain:") {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

module.exports = { SecureStore };
