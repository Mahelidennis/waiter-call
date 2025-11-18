# Quick Guide: Find DATABASE_URL from Your Current Page

You're on the correct page! Here's what to do:

## Steps:

1. **You're already on:** Settings → Database (which is correct!)

2. **Scroll down** on the same page you're viewing
   - The "Connection string" section is below the "Connection pooling configuration" section
   - Keep scrolling until you see a section titled "Connection string" or "Connection info"

3. **Look for tabs** that say:
   - URI
   - JDBC
   - Golang
   - etc.

4. **Click the "URI" tab**

5. **Copy the connection string** - it will look like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

6. **Replace `[YOUR-PASSWORD]`** with your actual database password
   - This is the password you set when creating the Supabase project
   - If you forgot it, click "Reset database password" (visible in your screenshot)

## What You'll See:

After scrolling, you should see something like:

```
Connection string
[URI] [JDBC] [Golang] [Nodejs] [Python] [C#]
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@...
[Copy button]
```

## If You Still Can't Find It:

1. Look for "Connection info" or "Connection parameters" section
2. Or try clicking on "API" in the left sidebar under Settings
3. Sometimes the connection string is also shown there

## Quick Alternative:

If you have your database password, I can help you construct the URL. You'll need:
- Your project reference ID (from the URL: `https://xxxxx.supabase.co`)
- Your database password
- The region (visible in project settings)

Let me know what you find when you scroll down!


