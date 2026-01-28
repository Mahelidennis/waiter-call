require('dotenv').config({ path: '.env.local' })

async function testSettings() {
  console.log('=== TESTING SETTINGS FUNCTIONALITY ===')
  
  try {
    // Test 1: Get restaurant from session
    console.log('1. Testing /api/restaurants/user...')
    const userResponse = await fetch('http://localhost:3000/api/restaurants/user')
    
    if (userResponse.ok) {
      const userData = await userResponse.json()
      console.log('✅ User restaurant data:', userData)
      
      // Test 2: Get specific restaurant details
      console.log('\n2. Testing /api/restaurants/[id]...')
      const restaurantResponse = await fetch(`http://localhost:3000/api/restaurants/${userData.id}`)
      
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json()
        console.log('✅ Restaurant details:', restaurantData)
        
        // Test 3: Update restaurant settings
        console.log('\n3. Testing PATCH /api/restaurants/[id]...')
        const updateResponse = await fetch(`http://localhost:3000/api/restaurants/${userData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Updated Restaurant ${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            menuUrl: 'https://example.com/menu'
          })
        })
        
        if (updateResponse.ok) {
          const updatedData = await updateResponse.json()
          console.log('✅ Update successful:', updatedData)
          console.log('✅ Settings functionality is working!')
        } else {
          const errorData = await updateResponse.json()
          console.log('❌ Update failed:', errorData)
        }
      } else {
        console.log('❌ Failed to get restaurant details')
      }
    } else {
      console.log('❌ Failed to get user restaurant data')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSettings()
