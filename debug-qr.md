# QR Page Debugging

## Test URLs
- Customer QR Page: https://waiter-call-p9e1pgv92-mahelis-projects.vercel.app/table/demo-table-1
- API Endpoint: https://waiter-call-p9e1pgv92-mahelis-projects.vercel.app/api/tables/demo-table-1

## Expected Test Data
From test-data.sql:
- QR Code: demo-table-1
- Table Number: T1
- Restaurant: Demo Restaurant

## Potential Issues to Check
1. Database connection
2. API response format
3. Material Symbols loading
4. Error handling in frontend
5. RLS policies blocking access

## Debug Steps
1. Check API endpoint directly
2. Check browser console for errors
3. Verify test data exists in database
4. Check network requests in dev tools
