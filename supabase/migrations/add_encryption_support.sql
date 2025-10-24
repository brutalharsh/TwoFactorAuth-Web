-- Migration to add encryption support to accounts table
-- Run this in your Supabase SQL editor

-- Add encryption-related columns to accounts table
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS encrypted_secret TEXT,
ADD COLUMN IF NOT EXISTS encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS encryption_salt TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Create a function to migrate existing unencrypted secrets
-- Note: This is just a placeholder - actual encryption should happen in the application
CREATE OR REPLACE FUNCTION migrate_to_encrypted_secrets()
RETURNS void AS $$
BEGIN
  -- Mark all existing secrets as unencrypted
  UPDATE public.accounts
  SET is_encrypted = false
  WHERE encrypted_secret IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_to_encrypted_secrets();

-- Add index on is_encrypted for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_encrypted ON public.accounts(is_encrypted);

-- Update RLS policies if needed
-- Existing policies should still work as they're based on user_id