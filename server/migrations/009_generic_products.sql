-- 009_generic_products.sql

DO  BEGIN
    CREATE TYPE fulfillment_type AS ENUM (
        'SHARED_ACCOUNT',
        'DEDICATED_ACCOUNT',
        'PROFILE',
        'SEAT',
        'INVITATION',
        'LICENSE_KEY',
        'ACTIVATION_CODE',
        'CREDENTIALS',
        'MANUAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    provider_id VARCHAR(255),
    fulfillment_type fulfillment_type NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS digital_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    fulfillment_type fulfillment_type NOT NULL,
    identifier TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    capacity INTEGER DEFAULT 1,
    occupied_capacity INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS digital_asset_id UUID REFERENCES digital_assets(id) ON DELETE SET NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS fulfillment_type fulfillment_type;

INSERT INTO product_categories (name, description) VALUES
('Streaming & Entertainment', 'Netflix, Disney+, Spotify, etc.'),
('Software & Tools', 'Microsoft 365, Canva, CapCut'),
('AI & Productivity', 'ChatGPT, Gemini, Claude'),
('VPN & Security', 'NordVPN, ExpressVPN'),
('Other Digital Goods', 'Miscellaneous digital subscriptions')
ON CONFLICT DO NOTHING;


-- Force PostgREST to reload its schema cache (for Supabase)
NOTIFY pgrst, 'reload schema';
