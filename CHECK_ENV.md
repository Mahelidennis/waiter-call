# Environment Variables Check

## Issue: Missing Supabase Environment Variables

The error suggests that Next.js isn't reading the environment variables from `.env.local`.

## Solution:

1. **Restart the dev server** - Environment variables are only loaded when the server starts:
   ```powershell
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Verify .env.local exists** in the `waiter-call` directory with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://expnitgukhmiojafrsrn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

3. **Check the file location** - `.env.local` must be in the root of `waiter-call` directory, same level as `package.json`

4. **For the "Table Not Found" error:**
   - Make sure you ran `test-data.sql` in Supabase SQL Editor
   - Verify the table exists: Go to Supabase → Tables → Check if "Table" table has data
   - The QR code should be: `demo-table-1`

## Quick Fix:

After restarting the server, the environment variables should load properly.


