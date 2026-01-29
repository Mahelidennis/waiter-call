# Call API Test

## Test URLs
- QR Page: https://waiter-call-otkb7t3ez-mahelis-projects.vercel.app/table/demo-table-1
- API Endpoint: https://waiter-call-otkb7t3ez-mahelis-projects.vercel.app/api/calls

## Test Data (from test-data.sql)
- Table ID: table-1
- Restaurant ID: test-rest-1
- QR Code: demo-table-1

## Manual API Test
```bash
curl -X POST https://waiter-call-otkb7t3ez-mahelis-projects.vercel.app/api/calls \
  -H "Content-Type: application/json" \
  -d '{"tableId": "table-1", "restaurantId": "test-rest-1"}'
```

## Expected Response
```json
{
  "id": "call-id",
  "tableId": "table-1",
  "restaurantId": "test-rest-1",
  "status": "PENDING",
  "table": {"id": "table-1", "number": "T1"},
  "waiter": null
}
```

## Possible Issues
1. Test data not in production DB
2. Button click handler not working
3. API endpoint error
4. Network connectivity issue
