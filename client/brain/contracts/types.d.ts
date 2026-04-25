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
