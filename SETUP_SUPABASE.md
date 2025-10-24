# Supabase Setup Instructions - Secure Configuration

## ⚠️ IMPORTANT: Security Update Required

This application now uses **Row Level Security (RLS)** with session-based authentication to restrict database access. Follow these instructions carefully to ensure proper security.

## Quick Setup for New Database

### 1. Go to your Supabase Dashboard
- Project URL: https://supabase.com/dashboard/project/jvjzumqmvqrghwltmcad

### 2. Run Database Migrations (IN ORDER)

**IMPORTANT:** Run these migrations in the exact order specified:

#### Step 2.1: Initial Setup
- Go to SQL Editor in your Supabase Dashboard
- Copy and run `supabase/migrations/001_initial_setup.sql`
- This creates:
  - `users` table for authentication
  - `auths` table for 2FA authenticators

### 3. Environment Variables
Your `.env` file should contain:
```
VITE_SUPABASE_PROJECT_ID="id"
VITE_SUPABASE_PUBLISHABLE_KEY="[YOUR_ANON_KEY]"
VITE_SUPABASE_URL="https://id.supabase.co"
```

**SECURITY NOTE:** Never expose your service role key in client-side code!

## Security Architecture

### Authentication Flow
1. **Custom Username/Password** with bcrypt hashing
2. **Session-based access control** with secure tokens
3. **RLS policies** enforce data isolation at the database level
4. **Automatic session expiry** after 24 hours

### How RLS Protects Your Data

#### With RLS Enabled (CURRENT SETUP):
- ✅ Each user can only access their own data
- ✅ Session tokens required for all database operations
- ✅ Invalid/expired sessions are automatically rejected
- ✅ Database-level security (not just application-level)

#### Without RLS (OLD SETUP - INSECURE):
- ❌ Anyone with the anon key can access all data
- ❌ No database-level user isolation
- ❌ Client-side security only (easily bypassed)

### Session Management
- Sessions expire after 24 hours
- Sessions are refreshed every 30 minutes during active use
- Logout properly deletes sessions from the database
- Multiple sessions per user are supported

## Database Structure

### users table
| Column   | Type    | Description           |
|----------|---------|----------------------|
| id       | SERIAL  | Primary key          |
| username | TEXT    | Unique username      |
| password | TEXT    | Bcrypt hashed password |

### sessions table (NEW)
| Column        | Type        | Description                   |
|--------------|-------------|-------------------------------|
| id           | SERIAL      | Primary key                   |
| user_id      | INTEGER     | Foreign key to users.id       |
| token        | TEXT        | Unique session token          |
| created_at   | TIMESTAMPTZ | Session creation time         |
| expires_at   | TIMESTAMPTZ | Session expiry time           |
| last_activity| TIMESTAMPTZ | Last activity timestamp       |
| ip_address   | TEXT        | Client IP (for audit)         |
| user_agent   | TEXT        | Browser info (for audit)      |

### auths table
| Column    | Type    | Description                    |
|-----------|---------|--------------------------------|
| id        | SERIAL  | Primary key                   |
| user_id   | INTEGER | Foreign key to users.id       |
| provider  | TEXT    | Service name (Google, etc.)   |
| name      | TEXT    | Account identifier             |
| key       | TEXT    | TOTP secret (Base32)          |
| algorithm | TEXT    | SHA1/SHA256/SHA512            |
| digits    | INTEGER | 6 or 8 digit codes            |
| period    | INTEGER | 30 or 60 second intervals     |

## Testing the Security Implementation

### 1. Verify RLS is Enabled
Run this query in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'auths', 'sessions');
```
All tables should show `rowsecurity = true`

### 2. Test Session-Based Access
```sql
-- This should FAIL (no session)
SELECT * FROM users;

-- This should also FAIL
SELECT * FROM auths;
```

### 3. Run the Application
```bash
npm run dev
```

### 4. Create a Test Account
- Go to http://localhost:8080
- Sign up with a new account
- Check the browser's localStorage for:
  - `session` - Contains session token
  - `simple_user` - Contains user info
  - `current_session_token` - Active session token

### 5. Verify Session in Database
After login, check the sessions table in Supabase:
```sql
-- Run in Supabase dashboard (with service role)
SELECT * FROM sessions WHERE expires_at > NOW();
```

## Additional Security Measures

### 1. CORS Configuration
Configure your hosting provider to only allow requests from your domain(s).

### 2. Environment Variables
- Keep your API keys secure
- Never commit `.env` files to version control
- Rotate keys periodically

### 3. Rate Limiting
Consider implementing rate limiting at your hosting provider level.

### 4. Security Headers
Add these headers to your web server:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### 5. Session Cleanup
Run this periodically to clean expired sessions:
```sql
SELECT cleanup_expired_sessions();
```

## Troubleshooting

### "Permission denied" errors
- Ensure all three migrations have been run in order
- Check that RLS is enabled on all tables
- Verify session token is being sent with requests

### Session not persisting
- Check browser localStorage
- Ensure cookies are enabled
- Verify session hasn't expired (24-hour limit)

### Cannot access own data
- Session might be expired
- Try logging out and back in
- Check browser console for errors

## Migration from Old Setup

If you're upgrading from the non-RLS version:
1. **Backup your data first!**
2. Run migrations 002 and 003
3. Update your application code to latest version
4. Test thoroughly before deploying

## Security Best Practices

1. **Never disable RLS** once enabled
2. **Monitor sessions** table for unusual activity
3. **Implement 2FA** for admin accounts
4. **Regular backups** of your database
5. **Audit logs** for sensitive operations

## Notes
- Sessions expire after 24 hours (configurable in code)
- Multiple device support (each login creates new session)
- Automatic session refresh during active use
- All password hashing uses bcryptjs with salt rounds of 10