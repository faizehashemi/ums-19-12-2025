-- Supabase Auth Setup for QuickStay
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table to store role and metadata
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'guest',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Super admins and hotel owners can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hotel_owner')
    )
  );

-- Users can update their own profile (except role and permissions)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    AND permissions = (SELECT permissions FROM public.user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hotel_owner')
    )
  );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hotel_owner')
    )
  );

-- 4. Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'guest' -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Update existing reservations table to use auth.uid()
-- Add user_email column if you want to keep email reference
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Update RLS policies for reservations
DROP POLICY IF EXISTS "Users can read own reservations" ON public.reservations;
CREATE POLICY "Users can read own reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Admins can read all reservations
DROP POLICY IF EXISTS "Admins can read all reservations" ON public.reservations;
CREATE POLICY "Admins can read all reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hotel_owner', 'accommodation_manager', 'finance_manager')
    )
  );

-- Users can create their own reservations
DROP POLICY IF EXISTS "Users can create own reservations" ON public.reservations;
CREATE POLICY "Users can create own reservations"
  ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.reservations TO authenticated;

-- 10. Create an initial super admin user (REPLACE WITH YOUR EMAIL)
-- After running this, sign up with this email and then run:
-- UPDATE public.user_profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';

-- Note: You'll need to manually create the first super admin by:
-- 1. Sign up with your email through the app
-- 2. Go to Supabase Dashboard > Table Editor > user_profiles
-- 3. Find your user and change role from 'guest' to 'super_admin'
