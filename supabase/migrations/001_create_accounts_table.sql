-- Clean setup for TwoFactorAuth application
-- This creates all necessary tables with proper RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS public.accounts CASCADE;

-- Create accounts table for storing 2FA accounts
CREATE TABLE public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issuer TEXT NOT NULL,
    account_name TEXT NOT NULL,
    secret TEXT NOT NULL,
    algorithm TEXT DEFAULT 'SHA1' CHECK (algorithm IN ('SHA1', 'SHA256', 'SHA512')),
    digits INTEGER DEFAULT 6 CHECK (digits IN (6, 8)),
    period INTEGER DEFAULT 30,
    icon_name TEXT,
    last_used TIMESTAMP WITH TIME ZONE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_order ON public.accounts(user_id, order_index);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts table
-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own accounts
CREATE POLICY "Users can insert own accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own accounts
CREATE POLICY "Users can update own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own accounts
CREATE POLICY "Users can delete own accounts" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;