require('dotenv').config({ path: '.env.local' })

async function testNewSignup() {
  console.log('=== TESTING NEW SIGNUP FLOW ===')
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/admin/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantName: `Test Restaurant ${Date.now()}`,
        adminEmail: `test${Date.now()}@example.com`,
        adminPassword: 'password123',
        phone: '+1234567890',
        address: '123 Test Street'
      })
    })

    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    if (response.ok && data.success && !data.requiresLogin) {
      console.log('✅ PERFECT: Signup successful with automatic authentication!')
      console.log('✅ Restaurant ID:', data.restaurantId)
      console.log('✅ No manual login required')
    } else if (data.requiresLogin) {
      console.log('❌ FAILED: Manual login still required')
      console.log('❌ This should not happen in production')
    } else {
      console.log('❌ FAILED: Signup failed')
      console.log('❌ Error:', data.error)
    }
  } catch (error) {
    console.error('❌ Request failed:', error)
  }
}

testNewSignup()
