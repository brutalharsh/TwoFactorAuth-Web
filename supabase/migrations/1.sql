-- Drop existing tables if they exist
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS auths CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (username-only authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    pass TEXT NOT NULL, -- Plain text password (WARNING: INSECURE - for development only)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create auths table (2FA accounts)
CREATE TABLE auths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'Google', 'GitHub', 'Microsoft'
    name TEXT NOT NULL, -- Account name/label
    key TEXT NOT NULL, -- TOTP secret key (should be encrypted in production)
    algorithm TEXT DEFAULT 'SHA1', -- SHA1, SHA256, SHA512
    digits INTEGER DEFAULT 6, -- Number of digits in TOTP code
    period INTEGER DEFAULT 30, -- Time period in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_auths_user_id ON auths(user_id);
CREATE INDEX idx_users_username ON users(username);

-- Disable Row Level Security for development
-- In production, implement proper RLS with session management
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auths DISABLE ROW LEVEL SECURITY;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auths_updated_at BEFORE UPDATE ON auths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON TABLE users IS 'User accounts for the 2FA authenticator app (username-only)';
COMMENT ON TABLE auths IS '2FA accounts/tokens for each user';
COMMENT ON COLUMN users.username IS 'Unique username for authentication';
COMMENT ON COLUMN users.pass IS 'Plain text password - INSECURE (for development only)';
COMMENT ON COLUMN auths.key IS 'Base32 encoded TOTP secret - should be encrypted';
COMMENT ON COLUMN auths.provider IS 'Service provider name (Google, GitHub, etc.)';
COMMENT ON COLUMN auths.algorithm IS 'TOTP algorithm: SHA1, SHA256, or SHA512';
COMMENT ON COLUMN auths.digits IS 'Number of digits in the TOTP code (typically 6 or 8)';
COMMENT ON COLUMN auths.period IS 'Time period in seconds for TOTP code rotation (typically 30)';