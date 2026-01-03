-- URGENT: Create your user profile NOW
-- Copy and run this ENTIRE script in Supabase SQL Editor

-- Step 1: Check if profile exists
SELECT 'Checking if profile exists...' as status;
SELECT * FROM user_profiles WHERE id = 'dce3b810-44eb-44ca-9bd7-b6221b81c69f';

-- Step 2: Get your email from auth.users
SELECT 'Your user info from auth.users:' as status;
SELECT id, email, raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE id = 'dce3b810-44eb-44ca-9bd7-b6221b81c69f';

-- Step 3: Create the profile (this will work even if it exists due to ON CONFLICT)
SELECT 'Creating/updating profile...' as status;
INSERT INTO user_profiles (id, email, full_name, role, permissions, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User') as full_name,
  'super_admin' as role,
  '{}'::jsonb as permissions,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users
WHERE id = 'dce3b810-44eb-44ca-9bd7-b6221b81c69f'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  updated_at = NOW();

-- Step 4: Verify it was created
SELECT 'Profile created! Here it is:' as status;
SELECT * FROM user_profiles WHERE id = 'dce3b810-44eb-44ca-9bd7-b6221b81c69f';

-- Step 5: Re-enable RLS if you disabled it
SELECT 'Re-enabling RLS...' as status;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

SELECT 'DONE! Refresh your browser now.' as status;
