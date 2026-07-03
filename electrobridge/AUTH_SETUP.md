# Auth Setup Guide

## Manual Steps Required in Supabase Dashboard

### 1. Email/Password Provider
- Navigate to **Supabase Dashboard → Authentication → Providers**
- Confirm **Email** provider is enabled (enabled by default)
- Disable "Confirm email" if you want auto-confirm for testing (optional)

### 2. Google OAuth Provider (⚠️ Required for Google Login to work)

**If Google login fails with "Unsupported provider: provider is not enabled", you must enable it manually.**

1. Go to **Supabase Dashboard → Authentication → Providers**
2. Find **Google** in the provider list and **enable the toggle**
3. You'll need a Google OAuth Client ID and Secret:

#### Creating Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth Client ID**
5. Application type: **Web application**
6. Name: "ElectroBridge"
7. Authorized JavaScript origins:
   - `https://electrobridge.vercel.app`
   - `http://localhost:3000` (for local dev)
8. Authorized redirect URIs (add BOTH):
   - `https://electrobridge.vercel.app/auth/callback`
   - `https://aqauempuwmbizqoaolop.supabase.co/auth/v1/callback`
9. Copy the **Client ID** and **Client Secret**
10. Paste them into the Supabase Google provider config form
11. Click **Save**

#### Verify it's working
- Visit `/login` or `/signup` on the live site
- Click "Sign in with Google"
- You should be redirected to Google's consent screen

### 3. URL Configuration
In **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: `https://electrobridge.vercel.app`
- **Redirect URLs**: `https://electrobridge.vercel.app/auth/callback`

## Environment Variables

All required env vars are already set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://aqauempuwmbizqoaolop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_r3IO09AVXZd-D11-WwS3Uw_rHnJq3uj
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

No new environment variables are needed beyond what already exists.

## Database Migration

Run the migration to create the user tables:

```bash
npx supabase migration up
```

Or execute the SQL in `supabase/migrations/20260630000001_user_profiles.sql` manually in Supabase SQL Editor.

## Tables Created

- `user_profiles` — extends `auth.users` with qualification, specialization, NET/GATE, location, resume ATS score
- `saved_opportunities` — user bookmarks (replaces localStorage)
- `applications` — application tracker with status (applied, under_review, shortlisted, rejected, accepted)
- `user_alerts` — saved search criteria for job alerts

## RLS Policies

All tables have Row Level Security enabled. Users can only access their own data. The `on_auth_user_created` trigger automatically creates a `user_profiles` row when a new user signs up.
