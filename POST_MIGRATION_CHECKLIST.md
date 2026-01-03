# Post-Migration Checklist

Use this checklist to ensure your migration to Supabase Auth is complete and working.

## ✅ Pre-Launch Checklist

### 1. Database Setup
- [ ] Open Supabase Dashboard at https://supabase.com/dashboard
- [ ] Navigate to your project: ecvmqksuizhvhmqqgbec
- [ ] Go to SQL Editor
- [ ] Copy and run the entire `supabase-setup.sql` script
- [ ] Verify tables created:
  - [ ] `user_profiles` table exists
  - [ ] RLS policies are enabled
  - [ ] Triggers are created

### 2. Dependencies
- [ ] Navigate to QuickStay-Frontend directory
- [ ] Run `npm install` to update dependencies
- [ ] Verify `@clerk/clerk-react` is removed from package.json
- [ ] Verify `@supabase/supabase-js` is in dependencies

### 3. Environment Variables
- [ ] Check `.env` file contains:
  ```
  VITE_SUPABASE_URL="https://ecvmqksuizhvhmqqgbec.supabase.co"
  VITE_SUPABASE_ANON_KEY="sb_publishable_IPYFb-E-zGqClI9Rn-kU7w_wAEYowG5"
  ```
- [ ] Verify no Clerk keys remain

### 4. Create Super Admin
- [ ] Start the app: `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Sign up with your admin email
- [ ] Check email for verification link (check spam!)
- [ ] Verify your email
- [ ] Go to Supabase Dashboard > Table Editor > user_profiles
- [ ] Find your user by email
- [ ] Edit the row and change role to `super_admin`
- [ ] Save the changes
- [ ] Refresh the app and verify you can access admin panel

## ✅ Functional Testing

### Authentication Flows
- [ ] **Sign Up Flow**
  - [ ] Can create new account
  - [ ] Receives verification email
  - [ ] Email verification works
  - [ ] Default role is 'guest'

- [ ] **Sign In Flow**
  - [ ] Can sign in with email/password
  - [ ] Shows error for wrong credentials
  - [ ] Redirects to intended page after login

- [ ] **Magic Link Flow**
  - [ ] Toggle to magic link works
  - [ ] Receives magic link email
  - [ ] Magic link logs user in
  - [ ] Session persists after magic link login

- [ ] **Sign Out**
  - [ ] Sign out button works
  - [ ] Redirects to login page
  - [ ] Session cleared
  - [ ] Can't access protected routes after signout

### Protected Routes
- [ ] **Public Routes** (should work without login):
  - [ ] Home page (/)
  - [ ] About page (/aboutUs)
  - [ ] Rooms listing (/rooms)
  - [ ] Information page (/information)

- [ ] **Protected Routes** (should redirect to login if not authenticated):
  - [ ] My Bookings (/my-bookings)
  - [ ] Admin Dashboard (/owner/dashboard)
  - [ ] Any /owner/* route

- [ ] **Admin Routes** (should redirect if not admin):
  - [ ] Dashboard accessible by admins
  - [ ] System settings accessible by super admins
  - [ ] Users & Roles only for super admins

### Admin Panel
- [ ] **Users & Roles Page**
  - [ ] Can access at /owner/system/users-roles
  - [ ] See list of all users
  - [ ] Can edit user roles
  - [ ] Changes save successfully
  - [ ] Can delete users (except self)
  - [ ] Can't edit own role
  - [ ] Can't delete own account

- [ ] **Permission System**
  - [ ] Different roles see different sidebar items
  - [ ] Guest users can't access admin panel
  - [ ] Hotel owners can access most modules
  - [ ] Module-specific managers see only their modules

### User Experience
- [ ] **Navbar**
  - [ ] Shows login button when not authenticated
  - [ ] Shows user profile when authenticated
  - [ ] Profile dropdown works
  - [ ] User name/email displays correctly
  - [ ] Sign out from dropdown works
  - [ ] "My Bookings" link works
  - [ ] Admin button shows for non-guest users

- [ ] **Login Page**
  - [ ] Form UI looks good
  - [ ] Toggle between sign in/sign up works
  - [ ] Toggle between password/magic link works
  - [ ] Error messages display correctly
  - [ ] Success messages display correctly
  - [ ] Loading states work

### Data & Integration
- [ ] **My Bookings**
  - [ ] User can see their own bookings
  - [ ] Bookings filtered by user_id
  - [ ] Can't see other users' bookings

- [ ] **Reservations**
  - [ ] New reservations save with user_id
  - [ ] User info populates from auth context
  - [ ] Reservation forms work correctly

## ✅ Security Verification

### Row Level Security
- [ ] Open Supabase Dashboard > Table Editor > user_profiles
- [ ] Verify RLS is enabled (green shield icon)
- [ ] Try to view table without auth (should fail)
- [ ] As regular user, try to edit another user's profile (should fail)
- [ ] As admin, can view and edit all profiles

### Permission Checks
- [ ] Create test users with different roles
- [ ] Verify each role sees appropriate menu items
- [ ] Verify route protection works for each role
- [ ] Verify API calls include auth headers

## ✅ Performance & UX

- [ ] **Loading States**
  - [ ] Login shows loading while processing
  - [ ] Protected routes show loading during auth check
  - [ ] Admin panel shows loading while fetching users

- [ ] **Error Handling**
  - [ ] Network errors display user-friendly messages
  - [ ] Auth errors show appropriate messages
  - [ ] Permission errors redirect correctly

## ✅ Production Readiness

### Before Going Live
- [ ] **Email Configuration**
  - [ ] Customize email templates in Supabase
  - [ ] Set up custom domain for emails (optional)
  - [ ] Test all email flows in production

- [ ] **Security Settings**
  - [ ] Enable rate limiting in Supabase
  - [ ] Configure password requirements
  - [ ] Enable CAPTCHA for signup (optional)
  - [ ] Set up 2FA for admin accounts (optional)

- [ ] **Monitoring**
  - [ ] Set up Supabase alerts
  - [ ] Monitor authentication logs
  - [ ] Track failed login attempts

- [ ] **Backup Plan**
  - [ ] Export user data regularly
  - [ ] Document recovery procedures
  - [ ] Test restore process

## ✅ Documentation

- [ ] Review [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- [ ] Review [SUPABASE_AUTH_MIGRATION.md](./SUPABASE_AUTH_MIGRATION.md)
- [ ] Understand the new auth flow
- [ ] Know how to manage user roles
- [ ] Know how to troubleshoot common issues

## 🎯 Success Criteria

Your migration is successful when:

✅ All authentication flows work correctly
✅ Users can sign up, sign in, and sign out
✅ Protected routes redirect correctly
✅ Admin panel is accessible to super admins
✅ Users & Roles management works
✅ RLS policies protect data correctly
✅ No Clerk code remains in the codebase
✅ All tests pass

## 📊 Migration Status

**Current Status:** ✅ COMPLETE

**Files Modified:** 25+ files
**Database Tables:** 1 (user_profiles)
**RLS Policies:** 5
**Roles Configured:** 10

---

## 🚀 Ready to Launch!

Once all items are checked, you're ready to:

1. Deploy to production
2. Migrate existing users (if any)
3. Send announcement to users
4. Monitor for issues

**Questions?** Check the troubleshooting section in SUPABASE_AUTH_MIGRATION.md

**Good luck! 🎉**
