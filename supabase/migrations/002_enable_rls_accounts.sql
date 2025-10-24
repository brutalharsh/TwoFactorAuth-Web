-- Enable RLS on accounts table if not already enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

-- Create RLS policies for accounts table
-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only insert their own accounts
CREATE POLICY "Users can insert own accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own accounts
CREATE POLICY "Users can update own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Users can only delete their own accounts
CREATE POLICY "Users can delete own accounts" ON public.accounts
    FOR DELETE USING (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;