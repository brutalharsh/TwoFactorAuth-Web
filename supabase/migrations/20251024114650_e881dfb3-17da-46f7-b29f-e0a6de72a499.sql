-- Create accounts table for storing TOTP secrets
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  account_name TEXT NOT NULL,
  secret TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'SHA1' CHECK (algorithm IN ('SHA1', 'SHA256', 'SHA512')),
  digits INTEGER NOT NULL DEFAULT 6 CHECK (digits IN (6, 8)),
  period INTEGER NOT NULL DEFAULT 30 CHECK (period > 0),
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, issuer, account_name)
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own accounts
CREATE POLICY "Users can view their own accounts"
  ON public.accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON public.accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON public.accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON public.accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_order ON public.accounts(user_id, order_index);