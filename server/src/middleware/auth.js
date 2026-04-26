/**
 * auth.js — JWT verification middleware using Supabase Auth.
 *
 * Supabase issues JWTs on sign-in. We validate them server-side by calling
 * supabase.auth.getUser(token), which verifies the signature and expiry
 * against Supabase's auth service. No additional JWT library is needed.
 *
 * Two guard helpers are exported for use in route handlers:
 *   - requireAuth(req, res)  → returns caller object or sends 401 and returns null
 *   - requireRole(caller, role, res) → returns true or sends 403 and returns false
 */

import { supabase } from "../db/supabase.js";
import { sendJson } from "../utils/json.js";

/**
 * Extracts and verifies the bearer token from the Authorization header.
 * Returns a caller object with { userId, role, merchantId, pseudonym } or null.
 *
 * @param {import("http").IncomingMessage} req
 * @returns {Promise<{userId: string, role: string, merchantId: string|null, pseudonym: string|null}|null>}
 */
export async function extractCaller(req) {
  const header = req.headers["authorization"] ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  // Validates token against Supabase auth and returns the user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  // Fetch role and domain-specific data from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, merchant_id, pseudonym")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role,
    merchantId: profile.merchant_id ?? null,
    pseudonym: profile.pseudonym ?? null,
  };
}

/**
 * Guard: requires a valid authenticated caller.
 * Sends 401 and returns null if no valid token is present.
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @returns {Promise<object|null>}
 */
export async function requireAuth(req, res) {
  const caller = await extractCaller(req);
  if (!caller) {
    sendJson(res, 401, { error: "unauthorized", message: "Valid Bearer token required." });
    return null;
  }
  return caller;
}

/**
 * Guard: requires a specific role.
 * Sends 403 and returns false if the caller does not have the required role.
 *
 * @param {{role: string}} caller
 * @param {"consumer"|"merchant"} role
 * @param {import("http").ServerResponse} res
 * @returns {boolean}
 */
export function requireRole(caller, role, res) {
  if (caller.role !== role) {
    sendJson(res, 403, {
      error: "forbidden",
      message: `This endpoint requires role: ${role}. Your role: ${caller.role}.`,
    });
    return false;
  }
  return true;
}
