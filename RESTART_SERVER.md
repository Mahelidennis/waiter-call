# How to Restart the Dev Server

## Method 1: Using the Terminal (Recommended)

1. **Find the terminal window** where `npm run dev` is running
   - Look for a terminal showing "Next.js" or "Local: http://localhost:3000"

2. **Stop the server:**
   - Press `Ctrl+C` in that terminal
   - Wait for it to stop (you'll see the prompt return)

3. **Start it again:**
   ```powershell
   npm run dev
   ```

## Method 2: If You Can't Find the Terminal

1. **Kill all Node processes:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Navigate to project directory:**
   ```powershell
   cd C:\Users\user\Desktop\smartservice\waiter-call
   ```

3. **Start the server:**
   ```powershell
   npm run dev
   ```

## Method 3: Using a New Terminal Window

1. **Open a new PowerShell/Terminal window**

2. **Navigate to the project:**
   ```powershell
   cd C:\Users\user\Desktop\smartservice\waiter-call
   ```

3. **Start the server:**
   ```powershell
   npm run dev
   ```

4. **Wait for this message:**
   ```
   ▲ Next.js 16.x.x
   - Local:        http://localhost:3000
   - Ready in X seconds
   ```

## After Restart

The environment variables from `.env.local` will be loaded, and the errors should be fixed!

Test these URLs:
- http://localhost:3000/table/demo-table-1
- http://localhost:3000/waiter/waiter-1
- http://localhost:3000/admin/test-rest-1

