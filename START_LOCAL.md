# How to Start the Server Locally

## Quick Start

1. **Open a terminal/command prompt**
2. **Navigate to the project directory:**
   ```powershell
   cd C:\Users\user\Desktop\smartservice\waiter-call
   ```

3. **Start the development server:**
   ```powershell
   npm run dev
   ```

4. **Wait for the server to start** - You should see:
   ```
   ▲ Next.js 16.0.1
   - Local:        http://localhost:3000
   - Ready in X seconds
   ```

5. **Open your browser** and go to: http://localhost:3000

## Troubleshooting

### Server won't start?

1. **Check if port 3000 is already in use:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   If something is using port 3000, either:
   - Stop that process, OR
   - Run on a different port: `npm run dev -- -p 3001`

2. **Check environment variables:**
   Make sure you have a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_key
   DATABASE_URL=your_database_url
   ```

3. **Check for errors in the terminal:**
   - Look for red error messages
   - Common issues:
     - Missing environment variables
     - Database connection errors
     - Prisma client not generated

4. **Regenerate Prisma Client:**
   ```powershell
   npx prisma generate
   ```

5. **Clear Next.js cache:**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

### Still not working?

Check the terminal output for specific error messages and share them for help.
