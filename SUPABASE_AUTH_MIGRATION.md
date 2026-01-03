# Supabase Auth Migration Guide

Your QuickStay application has been successfully migrated from Clerk to Supabase Auth with roles and user management!

## What Changed

### Authentication
- ✅ Replaced Clerk authentication with Supabase Auth
- ✅ Email/Password authentication with magic link support
- ✅ User profiles stored in Supabase database
- ✅ Role-based access control (RBAC) system

### User Management
- ✅ Admin UI for managing users and roles (at `/owner/system/users-roles`)
- ✅ Role assignment and permission management
- ✅ 10 predefined roles with granular permissions

## Setup Instructions

### Step 1: Run the SQL Setup Script

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: **ecvmqksuizhvhmqqgbec**
3. Go to **SQL Editor** in the left sidebar
4. Open the file `supabase-setup.sql` in the project root
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** to execute the script

This will create:
- `user_profiles` table with roles and permissions
- Row Level Security (RLS) policies
- Automatic user profile creation trigger
- Proper indexes and constraints

### Step 2: Create Your First Super Admin

After running the SQL script, you need to create your first super admin user:

1. **Sign up** through your application at http://localhost:5173
2. Use your email address (e.g., `admin@example.com`)
3. Create a password
4. Check your email for the verification link and verify your account
5. Go to **Supabase Dashboard** > **Table Editor** > **user_profiles**
6. Find your user by email
7. Click to edit the row
8. Change `role` from `guest` to `super_admin`
9. Click **Save**

Now you have full admin access!

### Step 3: Install Dependencies

Remove the old Clerk package and ensure Supabase is installed:

```bash
cd QuickStay-Frontend
npm uninstall @clerk/clerk-react
npm install
```

### Step 4: Configure Supabase Email Templates (Optional)

To customize the email templates for signup and magic links:

1. Go to **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic Link
   - Reset password
3. Update the redirect URLs to match your domain

### Step 5: Enable Email Confirmations (Optional but Recommended)

1. Go to **Supabase Dashboard** > **Authentication** > **Settings**
2. Under **Email Auth**, toggle "Enable email confirmations"
3. This ensures users verify their email before logging in

## Available Roles

The system includes 10 predefined roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `super_admin` | Full system access | All modules (read/write) |
| `hotel_owner` | Hotel management access | Most modules (read/write) |
| `finance_manager` | Financial operations | Accounts, Reports (read/write) |
| `kitchen_manager` | Kitchen operations | Mawaid module (read/write) |
| `transport_manager` | Transport operations | Transport module (read/write) |
| `accommodation_manager` | Room management | Accommodation module (read/write) |
| `hr_manager` | HR operations | HR module (read/write) |
| `guest` | Basic user access | Limited (read-only) |
| `audit_access` | Read-only audit access | All modules (read-only) |
| `report_view_access` | Reports only | Reports module (read-only) |

## Using the Admin Panel

Once you're logged in as a super admin:

1. Navigate to **Admin** button in the navbar
2. Go to **System** > **Users & Roles**
3. You can now:
   - View all registered users
   - Edit user roles
   - Delete users (except yourself)
   - See user creation dates and details

## Authentication Features

### For Users

**Sign Up:**
- Navigate to the login page
- Click "Don't have an account? Sign up"
- Enter email, password, and full name
- Verify email (if enabled)

**Sign In:**
- Email and password
- Or use "Magic Link" for passwordless login

**Password Reset:**
- Click "Forgot Password?" (you can add this to the login page)
- Receive email with reset link

### For Admins

**Managing Users:**
- Access the Users & Roles page
- Click edit icon to change a user's role
- Select new role from dropdown
- Click save icon

**Deleting Users:**
- Click delete icon next to a user
- Confirm deletion
- Note: This removes the profile; full account deletion requires Supabase Dashboard

## Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Email verification** for new signups
✅ **Password requirements** (minimum 6 characters)
✅ **Role-based access control** on all routes
✅ **Protected API calls** with authentication tokens

## Environment Variables

Your `.env` file now only needs:

```env
VITE_SUPABASE_URL="https://ecvmqksuizhvhmqqgbec.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_IPYFb-E-zGqClI9Rn-kU7w_wAEYowG5"
```

## Testing the Migration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the following flows:
   - ✅ Sign up with a new email
   - ✅ Verify email (check spam folder)
   - ✅ Sign in with email/password
   - ✅ Sign out
   - ✅ Sign in with magic link
   - ✅ Access protected routes
   - ✅ Try accessing admin panel (should redirect if not admin)
   - ✅ Promote a user to admin and test admin features

## Troubleshooting

### Issue: "Email not confirmed"
**Solution:** Check your email for the confirmation link, or disable email confirmations in Supabase Dashboard > Authentication > Settings

### Issue: "User not found" or "Invalid credentials"
**Solution:** Ensure the user is registered and email is verified

### Issue: "Permission denied" when accessing admin panel
**Solution:** Check that your user has `super_admin` role in the `user_profiles` table

### Issue: Can't see user profiles in admin panel
**Solution:** Ensure you ran the SQL setup script and RLS policies are created

### Issue: Magic link not working
**Solution:** Check your email spam folder and ensure the redirect URL matches your app URL

## API Reference

### Auth Context

The `useAuth()` hook provides:

```javascript
const {
  user,              // Supabase auth user object
  profile,           // User profile with role and permissions
  session,           // Current session
  loading,           // Loading state
  signUp,            // (email, password, fullName) => Promise
  signIn,            // (email, password) => Promise
  signInWithMagicLink, // (email) => Promise
  signOut,           // () => Promise
  resetPassword,     // (email) => Promise
  updatePassword,    // (newPassword) => Promise
  updateProfile,     // (updates) => Promise
  isAuthenticated,   // Boolean
  isLoaded           // Boolean
} = useAuth();
```

### Permission Utilities

```javascript
import { hasRole, isAdmin, canAccessModule } from '../utils/permissions';

// Check if user has a specific role
hasRole(profile, 'super_admin')

// Check if user is admin
isAdmin(profile)

// Check module access
canAccessModule(profile, 'dashboard', 'read')
```

## Next Steps

1. ✅ **Test thoroughly** - Test all authentication flows
2. ✅ **Create admin users** - Promote key team members to appropriate roles
3. ✅ **Customize email templates** - Make them match your brand
4. ✅ **Set up production** - Configure production Supabase project
5. ✅ **Enable 2FA** (Optional) - Add two-factor authentication for admins

## Support

If you encounter any issues:

1. Check the Supabase Dashboard > Logs for errors
2. Check browser console for client-side errors
3. Verify RLS policies are correctly set up
4. Ensure environment variables are correct

---

**Migration completed successfully! 🎉**

All components have been updated to use Supabase Auth. Your app now has:
- Secure authentication
- Role-based access control
- User management UI
- Permission system
- Database-backed user profiles
