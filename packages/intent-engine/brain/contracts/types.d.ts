export type ReceptivityLevel = "low" | "medium" | "high";
export type MobilityMode = "walking" | "stationary" | "transit";
export type SensitivityLevel = "low" | "medium" | "high";
export type TonePreference = "factual" | "emotional" | "neutral" | "minimal" | "friendly" | "playful";
export type DecisionType = "accept" | "dismiss" | "redeem" | "expire";

export interface LocalityLimiter {
  radius_km?: number;
  area_cell_ids?: string[];
  nearby_merchant_ids?: string[];
}

export interface ConsentMask {
  precise_location: boolean;
  background_location: boolean;
  learn_from_accepted_offers: boolean;
  learn_from_dismissed_offers: boolean;
  learn_from_redeemed_offers: boolean;
  push_notifications: boolean;
  anonymous_merchant_analytics: boolean;
}

export interface IntentPacket {
  intent_id: string;
  timestamp_utc: string;
  user_pseudonym: string;
  intent_label: string;
  intent_confidence: number;
  receptivity_level: ReceptivityLevel;
  time_budget_minutes: number;
  mobility_mode: MobilityMode;
  sensitivity_level: SensitivityLevel;
  tone_preference: TonePreference;
  hard_constraints: string[];
  locality: LocalityLimiter;
  channel_hint?: "push" | "in_app_only" | "in_app" | "widget";
  client_profile_signals?: {
    home_location?: { lat: number; lon: number; label?: string } | null;
    work_location?: { lat: number; lon: number; label?: string } | null;
    usual_meal_times?: {
      coffee?: string;
      lunch?: string;
      dinner?: string;
    } | null;
    food_preferences?: {
      coffee?: boolean;
      bakery?: boolean;
      ramen?: boolean;
      salads?: boolean;
      wine_bars?: boolean;
      gelato?: boolean;
    } | null;
    dietary_restrictions?: Array<
      "vegan" | "vegetarian" | "gluten_free" | "halal" | "kosher" | "nut_free" | "dairy_free" | "low_sugar"
    >;
    preferred_cuisines?: string[];
    location_access?: {
      precise_location?: boolean;
      background_location?: boolean;
    } | null;
  };
  context_snapshot?: {
    now_utc?: string;
    local_hour?: number;
    local_time_bucket?: string;
    weather_summary?: string;
    temperature_c?: number | null;
    event_intensity?: string;
    events?: Array<{ title: string; category: string }>;
  };
}

export interface OfferCard {
  offer_idempotency_key: string;
  headline: string;
  body_line: string;
  cta_text: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  valid_for_minutes: number;
  tone_style: "factual" | "friendly" | "minimal" | "playful";
}

export interface DecisionEvent {
  event_id: string;
  offer_id: string;
  user_pseudonym: string;
  timestamp_utc: string;
  decision: DecisionType;
  model_version: string;
  prompt_version: string;
}
