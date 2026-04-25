function optional(schema) {
  return { ...schema, optional: true };
}

function vString({ minLength, maxLength, pattern } = {}) {
  return { type: "string", minLength, maxLength, pattern };
}

function vNumber({ min, max, integer } = {}) {
  return { type: "number", min, max, integer: Boolean(integer) };
}

function vBoolean() {
  return { type: "boolean" };
}

function vEnum(values) {
  return { type: "enum", values };
}

function vArray(items, { minLength, maxLength } = {}) {
  return { type: "array", items, minLength, maxLength };
}

function vObject(shape) {
  return { type: "object", shape, allowUnknown: false };
}

function validateAgainstSchema(value, schema, path = "root", errors = []) {
  if (schema?.optional && (value === undefined || value === null)) {
    return errors;
  }

  switch (schema.type) {
    case "string": {
      if (typeof value !== "string") {
        errors.push(`${path} must be a string`);
        return errors;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path} must have at least ${schema.minLength} chars`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path} must have at most ${schema.maxLength} chars`);
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        errors.push(`${path} has invalid format`);
      }
      return errors;
    }
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push(`${path} must be a number`);
        return errors;
      }
      if (schema.integer && !Number.isInteger(value)) {
        errors.push(`${path} must be an integer`);
      }
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`${path} must be >= ${schema.min}`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`${path} must be <= ${schema.max}`);
      }
      return errors;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        errors.push(`${path} must be a boolean`);
      }
      return errors;
    }
    case "enum": {
      if (!schema.values.includes(value)) {
        errors.push(`${path} must be one of: ${schema.values.join(", ")}`);
      }
      return errors;
    }
    case "array": {
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`);
        return errors;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path} must have at least ${schema.minLength} items`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path} must have at most ${schema.maxLength} items`);
      }
      value.forEach((item, idx) =>
        validateAgainstSchema(item, schema.items, `${path}[${idx}]`, errors)
      );
      return errors;
    }
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${path} must be an object`);
        return errors;
      }
      const shape = schema.shape || {};
      const allowedKeys = new Set(Object.keys(shape));

      Object.keys(shape).forEach((key) => {
        const childSchema = shape[key];
        const childValue = value[key];
        if ((childValue === undefined || childValue === null) && !childSchema.optional) {
          errors.push(`${path}.${key} is required`);
          return;
        }
        validateAgainstSchema(childValue, childSchema, `${path}.${key}`, errors);
      });

      if (!schema.allowUnknown) {
        Object.keys(value).forEach((key) => {
          if (!allowedKeys.has(key)) {
            errors.push(`${path}.${key} is not allowed`);
          }
        });
      }
      return errors;
    }
    default:
      errors.push(`${path} has unsupported schema type`);
      return errors;
  }
}

export class SchemaValidationError extends Error {
  constructor(direction, schemaName, details) {
    super(`${direction} schema validation failed: ${schemaName}`);
    this.name = "SchemaValidationError";
    this.direction = direction;
    this.schemaName = schemaName;
    this.details = details;
  }
}

const isoDate = /^\d{4}-\d{2}-\d{2}T/;
const latSchema = vNumber({ min: -90, max: 90 });
const lonSchema = vNumber({ min: -180, max: 180 });

const localitySchema = optional(
  vObject({
    mode: optional(vEnum(["radius", "area_cells", "path_corridor"])),
    radius_km: optional(vNumber({ min: 0, max: 50 })),
    center: optional(
      vObject({
        lat: latSchema,
        lon: lonSchema,
      })
    ),
    area_cell_ids: optional(vArray(vString({ minLength: 1 }))),
    nearby_merchant_ids: optional(vArray(vString({ minLength: 1 }))),
    path_waypoints: optional(
      vArray(
        vObject({
          lat: latSchema,
          lon: lonSchema,
        }),
        { minLength: 1 }
      )
    ),
    buffer_radius_meters: optional(vNumber({ min: 1, max: 50000 })),
  })
);

const offerOutputItem = vObject({
  offer_id: vString({ minLength: 1 }),
  headline: vString({ minLength: 1 }),
  body_line: vString({ minLength: 1 }),
  cta_text: vString({ minLength: 1 }),
  discount_type: vString({ minLength: 1 }),
  discount_value: vNumber({ min: 0 }),
  valid_for_minutes: vNumber({ min: 1, max: 1440, integer: true }),
  tone_style: vString({ minLength: 1 }),
  ui_layout_variant: vString({ minLength: 1 }),
  expires_at_utc: vString({ pattern: isoDate }),
});

const canonicalOfferOutput = vObject({
  offer_idempotency_key: vString({ minLength: 1 }),
  headline: vString({ minLength: 1 }),
  body_line: vString({ minLength: 1 }),
  cta_text: vString({ minLength: 1 }),
  discount_type: vString({ minLength: 1 }),
  discount_value: vNumber({ min: 0 }),
  valid_for_minutes: vNumber({ min: 1, integer: true }),
  tone_style: vString({ minLength: 1 }),
  ui_layout_variant: vString({ minLength: 1 }),
  image_prompt: vString({ minLength: 1 }),
  justification: vObject({
    why_now_factors: vArray(vString({ minLength: 1 })),
    merchant_goal_alignment: vString({ minLength: 1 }),
  }),
  risk_flags: vObject({
    needs_human_review: vBoolean(),
    safety_notes: vArray(vString()),
  }),
  subheadline: optional(vString({ minLength: 1 })),
  merchant_disclaimer: optional(vString({ minLength: 1 })),
  channel_overrides: optional(
    vObject({
      push: optional(
        vObject({
          headline: vString({ minLength: 1 }),
          body_line: vString({ minLength: 1 }),
        })
      ),
      in_app: optional(
        vObject({
          headline: vString({ minLength: 1 }),
          body_line: vString({ minLength: 1 }),
        })
      ),
    })
  ),
});

/** Stored merchant row (matches `db.merchants` items). */
const internalMerchantRecord = vObject({
  merchant_id: vString({ minLength: 1 }),
  name: vString({ minLength: 1 }),
  category: vString({ minLength: 1 }),
  area_cell_id: vString({ minLength: 1 }),
  lat: vNumber({ min: -90, max: 90 }),
  lon: vNumber({ min: -180, max: 180 }),
  is_open_now: vBoolean(),
  price_band: vString({ minLength: 1 }),
  avg_ticket_size_eur: vNumber({ min: 0 }),
});

export const schemas = {
  health_output: vObject({
    ok: vBoolean(),
    llm_model: optional(vString()),
  }),

  intent_signal_input: vObject({
    intent_id: optional(vString({ minLength: 1 })),
    timestamp_utc: optional(vString({ pattern: isoDate })),
    user_pseudonym: vString({ minLength: 1 }),
    intent_label: vString({ minLength: 1 }),
    intent_confidence: optional(vNumber({ min: 0, max: 1 })),
    receptivity_level: optional(vEnum(["low", "medium", "high"])),
    time_budget_minutes: optional(vNumber({ min: 1, max: 180, integer: true })),
    mobility_mode: optional(vEnum(["walking", "stationary", "transit"])),
    sensitivity_level: optional(vEnum(["low", "medium", "high"])),
    tone_preference: optional(
      vEnum(["factual", "emotional", "neutral", "minimal", "friendly", "playful"])
    ),
    channel_hint: optional(vEnum(["push", "in_app_only", "in_app", "widget"])),
    hard_constraints: optional(vArray(vString({ minLength: 1 }))),
    privacy_flags: optional(
      vObject({
        raw_location_shared: vBoolean(),
        raw_behavior_shared: vBoolean(),
      })
    ),
    locality: localitySchema,
    next_best_intents: optional(
      vArray(
        vObject({
          intent_label: vString({ minLength: 1 }),
          intent_confidence: vNumber({ min: 0, max: 1 }),
        })
      )
    ),
    intent_stability_score: optional(vNumber({ min: 0, max: 1 })),
    cold_start_flag: optional(vBoolean()),
    city_context_ref: optional(vString({ minLength: 1 })),
  }),
  intent_signal_output: vObject({
    status: vString({ minLength: 1 }),
    intent_id: vString({ minLength: 1 }),
    processed_at_utc: vString({ pattern: isoDate }),
    next_poll_after_seconds: vNumber({ min: 0, integer: true }),
  }),

  get_active_offers_input: vObject({
    user_pseudonym: vString({ minLength: 1 }),
    channel: optional(vEnum(["push", "in_app", "widget"])),
    locality: localitySchema,
  }),
  get_active_offers_output: vObject({
    offers: vArray(offerOutputItem),
    generated_at_utc: vString({ pattern: isoDate }),
  }),
  offer_generate_input: vObject({
    intent_packet: {
      type: "object",
      allowUnknown: true,
      shape: {
        intent_label: vString({ minLength: 1 }),
        intent_confidence: vNumber({ min: 0, max: 1 }),
        receptivity_level: vEnum(["low", "medium", "high"]),
        time_budget_minutes: vNumber({ min: 1, max: 180, integer: true }),
        tone_preference: vString({ minLength: 1 }),
        hard_constraints: vArray(vString({ minLength: 1 })),
        locality: optional(localitySchema),
      },
    },
    channel: optional(vEnum(["push", "in_app", "widget"])),
    locality: localitySchema,
    model: optional(vString({ minLength: 1 })),
    prompt_version: optional(vString({ minLength: 1 })),
  }),
  offer_generate_output: vObject({
    offer: canonicalOfferOutput,
    model_version: vString({ minLength: 1 }),
    prompt_version: vString({ minLength: 1 }),
    used_fallback: vBoolean(),
  }),

  offer_decision_input: vObject({
    offer_id: vString({ minLength: 1 }),
    user_pseudonym: vString({ minLength: 1 }),
    decision: vEnum(["accept", "dismiss"]),
    decision_timestamp_utc: optional(vString({ pattern: isoDate })),
    channel: optional(vEnum(["push", "in_app", "widget"])),
    reason_code: optional(vString({ minLength: 1 })),
    context_ref: optional(vString({ minLength: 1 })),
  }),
  offer_decision_output: vObject({
    offer_id: vString({ minLength: 1 }),
    status: vString({ minLength: 1 }),
    decision: vEnum(["accept", "dismiss"]),
    recorded_at_utc: vString({ pattern: isoDate }),
  }),

  redemption_create_token_input: vObject({
    offer_id: vString({ minLength: 1 }),
    user_pseudonym: vString({ minLength: 1 }),
    merchant_id: vString({ minLength: 1 }),
    requested_at_utc: optional(vString({ pattern: isoDate })),
    device_nonce: optional(vString({ minLength: 1 })),
  }),
  redemption_create_token_output: vObject({
    offer_id: vString({ minLength: 1 }),
    token: vString({ minLength: 1 }),
    qr_payload: vString({ minLength: 1 }),
    expires_at_utc: vString({ pattern: isoDate }),
    ttl_seconds: vNumber({ min: 1, integer: true }),
  }),

  redemption_validate_input: vObject({
    token: vString({ minLength: 1 }),
    offer_id: optional(vString({ minLength: 1 })),
    merchant_id: optional(vString({ minLength: 1 })),
    scanner_id: optional(vString({ minLength: 1 })),
    validated_at_utc: optional(vString({ pattern: isoDate })),
    transaction_amount_eur: optional(vNumber({ min: 0 })),
  }),
  redemption_validate_output: vObject({
    token: vString({ minLength: 1 }),
    is_valid: vBoolean(),
    redemption_id: vString({ minLength: 1 }),
    cashback_credited_eur: vNumber({ min: 0 }),
    validated_at_utc: vString({ pattern: isoDate }),
  }),

  wallet_cashback_input: vObject({
    user_pseudonym: vString({ minLength: 1 }),
  }),
  wallet_cashback_output: vObject({
    user_pseudonym: vString({ minLength: 1 }),
    cashback_balance_eur: vNumber({ min: 0 }),
    updated_at_utc: vString({ pattern: isoDate }),
  }),

  merchant_rules_create_input: vObject({
    merchant_id: vString({ minLength: 1 }),
    campaign_goal: optional(vString({ minLength: 1 })),
    constraints: vObject({
      max_discount_pct: optional(vNumber({ min: 0, max: 100 })),
      max_discount_amount_eur: optional(vNumber({ min: 0 })),
      daily_campaign_budget_eur: optional(vNumber({ min: 0 })),
      weekly_campaign_budget_eur: optional(vNumber({ min: 0 })),
      max_redemptions_per_day: optional(vNumber({ min: 0, integer: true })),
      max_cashback_per_redemption_eur: optional(vNumber({ min: 0 })),
      eligible_categories: optional(vArray(vString({ minLength: 1 }))),
      excluded_skus: optional(vArray(vString({ minLength: 1 }))),
      min_order_value_eur: optional(vNumber({ min: 0 })),
      bundle_required: optional(vBoolean()),
      inventory_guardrail: optional(vString({ minLength: 1 })),
      active_days: optional(vArray(vString({ minLength: 1 }))),
      active_hours: optional(vArray(vString({ minLength: 1 }))),
      max_offer_validity_minutes: optional(vNumber({ min: 1, integer: true })),
      blackout_periods: optional(vArray(vString({ minLength: 1 }))),
      cooldown_minutes_per_user: optional(vNumber({ min: 0, integer: true })),
      service_radius_km: optional(vNumber({ min: 0, max: 50 })),
      allowed_area_cells: optional(vArray(vString({ minLength: 1 }))),
      max_walking_time_minutes: optional(vNumber({ min: 0, integer: true })),
      allowed_channels: optional(vArray(vEnum(["push", "in_app", "widget"]))),
      max_push_per_day: optional(vNumber({ min: 0, integer: true })),
      tone_whitelist: optional(vArray(vString({ minLength: 1 }))),
      brand_safety_terms: optional(
        vObject({
          required: optional(vArray(vString({ minLength: 1 }))),
          forbidden: optional(vArray(vString({ minLength: 1 }))),
        })
      ),
      repeat_targeting_limit: optional(vNumber({ min: 0, integer: true })),
      sensitive_context_blocklist: optional(vArray(vString({ minLength: 1 }))),
      conservative_mode: optional(vBoolean()),
    }),
  }),
  merchant_rules_create_output: vObject({
    merchant_rule_id: vString({ minLength: 1 }),
    merchant_id: vString({ minLength: 1 }),
    status: vString({ minLength: 1 }),
    created_at_utc: vString({ pattern: isoDate }),
  }),

  merchant_rules_patch_input: vObject({
    merchant_rule_id: vString({ minLength: 1 }),
    merchant_id: vString({ minLength: 1 }),
    constraints: vObject({
      max_discount_pct: optional(vNumber({ min: 0, max: 100 })),
      daily_campaign_budget_eur: optional(vNumber({ min: 0 })),
      active_hours: optional(vArray(vString({ minLength: 1 }))),
      max_push_per_day: optional(vNumber({ min: 0, integer: true })),
    }),
  }),
  merchant_rules_patch_output: vObject({
    merchant_rule_id: vString({ minLength: 1 }),
    merchant_id: vString({ minLength: 1 }),
    status: vString({ minLength: 1 }),
    updated_at_utc: vString({ pattern: isoDate }),
  }),

  merchant_dashboard_input: vObject({
    merchant_id: vString({ minLength: 1 }),
  }),
  merchant_dashboard_overview_output: vObject({
    merchant_id: vString({ minLength: 1 }),
    kpis: vObject({
      offers_generated: vNumber({ min: 0, integer: true }),
      acceptance_rate: vNumber({ min: 0, max: 1 }),
      redemption_rate: vNumber({ min: 0, max: 1 }),
      estimated_net_uplift_eur: vNumber(),
    }),
    as_of_utc: vString({ pattern: isoDate }),
  }),
  merchant_dashboard_funnel_output: vObject({
    merchant_id: vString({ minLength: 1 }),
    funnel: vObject({
      delivered: vNumber({ min: 0, integer: true }),
      viewed: vNumber({ min: 0, integer: true }),
      accepted: vNumber({ min: 0, integer: true }),
      redeemed: vNumber({ min: 0, integer: true }),
    }),
    as_of_utc: vString({ pattern: isoDate }),
  }),
  merchant_dashboard_context_performance_output: vObject({
    merchant_id: vString({ minLength: 1 }),
    context_performance: vArray(
      vObject({
        daypart: vString({ minLength: 1 }),
        weather_bucket: vString({ minLength: 1 }),
        accept_rate: vNumber({ min: 0, max: 1 }),
        redemption_rate: vNumber({ min: 0, max: 1 }),
      })
    ),
    as_of_utc: vString({ pattern: isoDate }),
  }),

  internal_context_ingest_weather_input: vObject({
    city: vString({ minLength: 1 }),
    area_cell_id: vString({ minLength: 1 }),
    observed_at_utc: vString({ pattern: isoDate }),
    weather_summary: vString({ minLength: 1 }),
    temperature_c: vNumber(),
    precipitation_mm: vNumber({ min: 0 }),
    condition: vString({ minLength: 1 }),
  }),
  internal_context_ingest_events_input: vObject({
    city: vString({ minLength: 1 }),
    area_cell_id: vString({ minLength: 1 }),
    observed_at_utc: vString({ pattern: isoDate }),
    event_intensity: vString({ minLength: 1 }),
    events: vArray(
      vObject({
        event_id: vString({ minLength: 1 }),
        title: vString({ minLength: 1 }),
        category: vString({ minLength: 1 }),
        start_utc: vString({ pattern: isoDate }),
        end_utc: vString({ pattern: isoDate }),
      })
    ),
  }),
  internal_context_ingest_payone_sim_input: vObject({
    merchant_id: vString({ minLength: 1 }),
    snapshot_at_utc: vString({ pattern: isoDate }),
    merchant_transaction_density_index: vNumber(),
    baseline_hourly_tx_count: vNumber({ min: 0, integer: true }),
    current_hour_tx_count: vNumber({ min: 0, integer: true }),
    quiet_hour_gap_pct: vNumber(),
    avg_ticket_size_eur: vNumber({ min: 0 }),
  }),
  internal_context_ingest_output: vObject({
    status: vString({ minLength: 1 }),
    records_ingested: vNumber({ min: 0, integer: true }),
    source: vString({ minLength: 1 }),
    processed_at_utc: vString({ pattern: isoDate }),
  }),

  internal_generation_run_input: vObject({
    request_id: vString({ minLength: 1 }),
    generation_mode: vString({ minLength: 1 }),
    merchant_profile: vObject({
      merchant_id: vString({ minLength: 1 }),
      category: vString({ minLength: 1 }),
      is_open_now: vBoolean(),
      price_band: vString({ minLength: 1 }),
    }),
    constraints: vObject({
      max_discount_pct: vNumber({ min: 0, max: 100 }),
      campaign_goal: vString({ minLength: 1 }),
      excluded_skus: vArray(vString({ minLength: 1 })),
      max_validity_minutes: vNumber({ min: 1, integer: true }),
    }),
    intent_packet: vObject({
      intent_label: vString({ minLength: 1 }),
      intent_confidence: vNumber({ min: 0, max: 1 }),
      receptivity_level: vEnum(["low", "medium", "high"]),
      time_budget_minutes: vNumber({ min: 1, max: 180, integer: true }),
      tone_preference: vString({ minLength: 1 }),
      hard_constraints: vArray(vString({ minLength: 1 })),
    }),
    context_snapshot: vObject({
      weather_summary: vString({ minLength: 1 }),
      demand_gap_pct: vNumber(),
      event_intensity: vString({ minLength: 1 }),
      local_time_bucket: vString({ minLength: 1 }),
    }),
    channel_context: vObject({
      channel: vEnum(["push", "in_app", "widget"]),
      headline_char_limit: vNumber({ min: 1, integer: true }),
      body_char_limit: vNumber({ min: 1, integer: true }),
    }),
  }),
  internal_generation_run_output: canonicalOfferOutput,

  internal_merchant_scrape_profile_input: vObject({
    merchant_id: vString({ minLength: 1 }),
    google_maps_url: vString({ minLength: 1 }),
    requested_by: optional(vString({ minLength: 1 })),
    request_id: optional(vString({ minLength: 1 })),
  }),
  internal_merchant_scrape_profile_output: vObject({
    merchant_id: vString({ minLength: 1 }),
    category: vString({ minLength: 1 }),
    opening_hours: vArray(vString({ minLength: 1 })),
    tags: vArray(vString({ minLength: 1 })),
    confidence: vNumber({ min: 0, max: 1 }),
    status: vString({ minLength: 1 }),
  }),

  internal_merchant_upsert_input: internalMerchantRecord,
  internal_merchant_upsert_output: vObject({
    merchant_id: vString({ minLength: 1 }),
    status: vEnum(["upserted"]),
    total_merchants: vNumber({ min: 0, integer: true }),
  }),

  internal_merchants_list_input: vObject({
    merchant_id: optional(vString({ minLength: 1 })),
  }),
  internal_merchants_list_output: vObject({
    merchants: vArray(internalMerchantRecord),
  }),
};

export function validateSchema(schemaName, value, direction) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Missing schema: ${schemaName}`);
  }
  const details = validateAgainstSchema(value, schema);
  if (details.length) {
    throw new SchemaValidationError(direction, schemaName, details);
  }
}
