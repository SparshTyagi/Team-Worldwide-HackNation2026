#!/usr/bin/env bash
# Seed merchants via HTTP, then client intent + active offers.
# Usage: ./scripts/seed-merchants-and-offer.sh [BASE_URL]
# Example: OPENROUTER_API_KEY= ./scripts/seed-merchants-and-offer.sh http://127.0.0.1:8080
set -euo pipefail
BASE="${1:-http://127.0.0.1:8080}"

json_post() {
  curl -sS -X POST "$1" -H "Content-Type: application/json" -d "$2"
}

echo "=== POST merchants (upsert) ==="
json_post "$BASE/internal/merchants" '{
  "merchant_id": "m_3100",
  "name": "Green Fork Bistro",
  "category": "restaurant",
  "cuisine": "modern_european",
  "discount_events": ["weekday_lunch", "event_night"],
  "dietary_restrictions": ["vegetarian", "nut_free"],
  "hours": ["Mon-Fri 11:00-21:00", "Sat-Sun 12:00-22:00"],
  "max_discount_value": 20,
  "budget": 400,
  "area_cell_id": "u0wtm3",
  "lat": 48.7765,
  "lon": 9.1815,
  "is_open_now": true,
  "price_band": "mid",
  "avg_ticket_size_eur": 14.5
}'
echo

json_post "$BASE/internal/merchants" '{
  "merchant_id": "m_3101",
  "name": "Stadtbad Sauna Snack",
  "category": "wellness_cafe",
  "cuisine": "cafe",
  "discount_events": ["morning_rush", "post_gym"],
  "dietary_restrictions": ["vegan", "dairy_free", "low_sugar"],
  "hours": ["Mon-Sun 08:00-20:00"],
  "max_discount_value": 15,
  "budget": 300,
  "area_cell_id": "u0wtm3",
  "lat": 48.778,
  "lon": 9.184,
  "is_open_now": true,
  "price_band": "premium",
  "avg_ticket_size_eur": 9.9
}'
echo

json_post "$BASE/internal/merchants" '{
  "merchant_id": "m_3102",
  "name": "Markthalle Quick Bite",
  "category": "fast_casual",
  "cuisine": "street_food",
  "discount_events": ["market_day", "late_lunch"],
  "dietary_restrictions": ["halal", "vegetarian"],
  "hours": ["Mon-Fri 10:00-19:00", "Sat 10:00-16:00"],
  "max_discount_value": 10,
  "budget": 200,
  "area_cell_id": "u0wtm6",
  "lat": 48.781,
  "lon": 9.1785,
  "is_open_now": true,
  "price_band": "budget",
  "avg_ticket_size_eur": 7.25
}'
echo

echo "=== GET /internal/merchants (list) ==="
curl -sS "$BASE/internal/merchants"
echo

echo "=== POST /v1/intent-signal ==="
json_post "$BASE/v1/intent-signal" '{
  "user_pseudonym": "usr_seed_demo",
  "intent_label": "quick_lunch_now",
  "intent_confidence": 0.79,
  "receptivity_level": "high",
  "time_budget_minutes": 20,
  "mobility_mode": "walking",
  "tone_preference": "factual",
  "hard_constraints": ["vegetarian_only"],
  "locality": {
    "mode": "radius",
    "radius_km": 2,
    "center": { "lat": 48.7758, "lon": 9.1829 }
  }
}'
echo

echo "=== GET /v1/offers/active ==="
curl -sS "$BASE/v1/offers/active?user_pseudonym=usr_seed_demo&channel=in_app"
echo
