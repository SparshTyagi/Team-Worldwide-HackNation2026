/**
 * auth-service.js — Registration, login, and logout via Supabase Auth.
 *
 * All three operations delegate to Supabase's auth service and return
 * structured response objects ready for the HTTP layer.
 */

import { supabase } from "../db/supabase.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

const TARGET_MERCHANT_CATEGORIES = [
  "cafe",
  "coffee",
  "bakery",
  "restaurant",
  "bistro",
  "food",
  "lunch",
  "deli",
  "bar",
  "wine",
  "dessert",
  "gelato",
];

function nowIso() {
  return new Date().toISOString();
}

function normalizeCategory(category) {
  return String(category || "")
    .trim()
    .toLowerCase();
}

function isChallengeTargetCategory(category) {
  const normalized = normalizeCategory(category);
  if (!normalized) return false;
  return TARGET_MERCHANT_CATEGORIES.some((entry) => normalized.includes(entry));
}

function createAuthClient() {
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Registers a new user and creates their profile row.
 *
 * For merchants: also creates a stub merchant row so the FK is immediately usable.
 *
 * @param {{ email: string, password: string, role: "consumer"|"merchant", display_name?: string, business_category?: string }} payload
 * @returns {Promise<{ session: object, user_id: string, role: string }>}
 */
export async function register({ email, password, role, display_name, business_category }) {
  if (!["consumer", "merchant"].includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be "consumer" or "merchant".`);
  }

  // 1. Create the auth.users row via Supabase Auth Admin API to bypass server IP rate limits
  const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (signUpError) throw new Error(`Auth error: ${signUpError.message}`);
  const user = userData.user;

  // 1b. Immediately log in to get a session using an isolated client
  const authClient = createAuthClient();
  const { data: authData, error: loginError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });
  
  if (loginError) throw new Error(`Login error after registration: ${loginError.message}`);

  let merchantId = null;

  // 2. For merchants: create a stub merchant row first so the FK can be set
  // USING THE GLOBAL CLIENT (service role)
  if (role === "merchant") {
    const requestedCategory = normalizeCategory(business_category || "uncategorized");
    const challengeTargetFit = isChallengeTargetCategory(requestedCategory);
    const { data: merchantRow, error: merchantError } = await supabase
      .from("merchants")
      .insert({
        name: display_name || email.split("@")[0],
        category: requestedCategory || "uncategorized",
        business_hours: {
          approval_status: "pending",
          approval_notes: "Awaiting challenge team review.",
          approval_updated_at: nowIso(),
          challenge_target_fit: challengeTargetFit,
          requested_category: requestedCategory || "uncategorized",
          onboarding_source: "auth_register",
        },
      })
      .select("id")
      .single();

    if (merchantError) throw new Error(`Merchant creation error: ${merchantError.message}`);
    merchantId = merchantRow.id;
  }

  // 3. Create profile row linking auth user to role + domain data
  const profileData = {
    id: user.id,
    role,
    display_name: display_name ?? null,
    merchant_id: merchantId,
    // Consumers get an auto-generated pseudonym; this is what the server uses
    pseudonym: role === "consumer" ? `usr_${user.id.slice(0, 8)}` : null,
    created_at: nowIso(),
  };

  const { error: profileError } = await supabase.from("profiles").insert(profileData);
  if (profileError) throw new Error(`Profile creation error: ${profileError.message}`);

  return {
    user_id: user.id,
    role,
    pseudonym: profileData.pseudonym,
    merchant_id: merchantId,
    merchant_approval_status: role === "merchant" ? "pending" : null,
    display_name: profileData.display_name,
    session: authData.session,
    registered_at_utc: nowIso(),
  };
}

/**
 * Authenticates an existing user and returns their session.
 *
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ session: object, user_id: string, role: string }>}
 */
export async function login({ email, password }) {
  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth error: ${error.message}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, merchant_id, pseudonym, display_name")
    .eq("id", data.user.id)
    .maybeSingle();

  let merchantApprovalStatus = null;
  if (profile?.merchant_id) {
    const { data: merchant } = await supabase
      .from("merchants")
      .select("business_hours")
      .eq("id", profile.merchant_id)
      .maybeSingle();
    merchantApprovalStatus = merchant?.business_hours?.approval_status || "pending";
  }

  return {
    user_id: data.user.id,
    role: profile?.role ?? "consumer",
    pseudonym: profile?.pseudonym ?? null,
    merchant_id: profile?.merchant_id ?? null,
    merchant_approval_status: merchantApprovalStatus,
    display_name: profile?.display_name ?? null,
    session: data.session,
    logged_in_at_utc: nowIso(),
  };
}

/**
 * Signs out the current session.
 *
 * @returns {Promise<{ status: string }>}
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Auth error: ${error.message}`);
  return { status: "logged_out", logged_out_at_utc: nowIso() };
}
