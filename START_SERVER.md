# How to Start the Dev Server

## Manual Start (Recommended)

1. **Open a new terminal/PowerShell window**

2. **Navigate to the project directory:**
   ```powershell
   cd C:\Users\user\Desktop\smartservice\waiter-call
   ```

3. **Start the dev server:**
   ```powershell
   npm run dev
   ```

4. **Wait for this message:**
   ```
   ▲ Next.js 16.x.x
   - Local:        http://localhost:3000
   - Ready in X seconds
   ```

5. **Open your browser and visit:**
   - http://localhost:3000/table/demo-table-1

## If You See Errors

### "Port 3000 is already in use"
- Another process is using port 3000
- Kill it: `Get-Process -Name node | Stop-Process`
- Or use a different port: `npm run dev -- -p 3001`

### TypeScript/Build Errors
- Check the error message
- Common fixes:
  - Run `npm install` again
  - Delete `.next` folder and try again
  - Check for missing dependencies

### "Cannot find module"
- Run: `npm install`
- Then: `npx prisma generate`

## Quick Test

Once server is running, test these URLs:
1. http://localhost:3000/table/demo-table-1 (Customer page)
2. http://localhost:3000/waiter/waiter-1 (Waiter dashboard)
3. http://localhost:3000/admin/test-rest-1 (Admin dashboard)




