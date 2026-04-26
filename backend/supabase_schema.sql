-- Supabase Schema for Generative City Wallet

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS offer_events CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS context_snapshots CASCADE;
DROP TABLE IF EXISTS merchant_rules CASCADE;
DROP TABLE IF EXISTS intents CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants Table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    business_hours JSONB,
    address TEXT,
    google_maps_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intents Table
CREATE TABLE intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    intent_label TEXT NOT NULL,
    intent_confidence DECIMAL(3,2),
    receptivity_level TEXT,
    time_budget_minutes INT,
    tone_preference TEXT,
    hard_constraints JSONB,
    locality JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Rules Table
CREATE TABLE merchant_rules (
    merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
    campaign_goal TEXT NOT NULL,
    max_discount_pct INT,
    max_validity_minutes INT,
    excluded_skus JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context Snapshots Table
CREATE TABLE context_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('weather', 'events', 'payone')),
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offers Table
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    body_line TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value DECIMAL(10,2),
    valid_for_minutes INT,
    tone_style TEXT,
    ui_layout_variant TEXT,
    status TEXT DEFAULT 'shown' CHECK (status IN ('shown', 'accepted', 'dismissed', 'redeemed', 'expired')),
    generation_meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Offer Events Table
CREATE TABLE offer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('shown', 'accepted', 'dismissed', 'redeemed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions Table
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
    cashback_eur DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    redeemed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_redemptions_token ON redemptions(token);
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_merchant_id ON redemptions(merchant_id);
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_offers_merchant_id ON offers(merchant_id);
CREATE INDEX idx_intents_user_id ON intents(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_events ENABLE ROW LEVEL SECURITY;

-- Note: Policies need to be added based on client access patterns.
-- For server-side backend using SERVICE_ROLE, policies are bypassed.
