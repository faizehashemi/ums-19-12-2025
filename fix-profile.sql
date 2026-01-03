-- Emergency fix: Create user profile manually
-- Run this in Supabase SQL Editor

-- First, check if the user exists
SELECT * FROM user_profiles WHERE id = 'dce3b810-44eb-44ca-9bd7-b6221b81c69f';

-- If no results, create the profile manually:
INSERT INTO user_profiles (id, email, full_name, role, permissions, created_at, updated_at)
VALUES (
  'dce3b810-44eb-44ca-9bd7-b6221b81c69f',
  'your-email@example.com',  -- REPLACE WITH YOUR ACTUAL EMAIL
  'Your Full Name',           -- REPLACE WITH YOUR NAME
  'super_admin',
  '{}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  updated_at = NOW();

-- Verify it was created:
SELECT * FROM user_profiles WHERE id = 'dce3b810-44eb-44ca-9bd7-b6221b81c69f';

-- Also check RLS policies are allowing reads:
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
