-- Simple Clean Database Structure for TwoFactorAuth
-- Run this single file in Supabase SQL Editor

-- ================================================
-- USERS TABLE - Simple username/password auth
-- ================================================
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL  -- Hashed with bcrypt in application
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ================================================
-- AUTHS TABLE - Store 2FA authenticators
-- ================================================
CREATE TABLE IF NOT EXISTS public.auths (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,      -- Google, GitHub, Microsoft, etc.
  name TEXT NOT NULL,           -- john@gmail.com, user account
  key TEXT NOT NULL,            -- TOTP secret key (Base32)
  algorithm TEXT DEFAULT 'SHA1' CHECK (algorithm IN ('SHA1', 'SHA256', 'SHA512')),
  digits INTEGER DEFAULT 6 CHECK (digits IN (6, 8)),
  period INTEGER DEFAULT 30 CHECK (period IN (30, 60))
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_auths_user_id ON public.auths(user_id);

-- ================================================
-- DONE! That's all you need.
-- ================================================

-- The application handles:
-- • Password hashing with bcrypt
-- • Session management with localStorage
-- • TOTP code generation
-- • All authentication logic