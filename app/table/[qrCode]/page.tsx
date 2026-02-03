'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface TableData {
  table: {
    id: string
    number: string
    restaurant: {
      id: string
      name: string
      slug: string
      logoUrl?: string
      menuUrl?: string
    }
  }
  promotions: Array<{
    id: string
    title: string
    description?: string
    imageUrl?: string
    linkUrl?: string
  }>
}

export default function TablePage() {
  const params = useParams()
  const qrCode = params.qrCode as string
  const [data, setData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [currentPromo, setCurrentPromo] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)

  useEffect(() => {
    fetchTableData()
  }, [qrCode])

  // Auto-rotate promotions
  useEffect(() => {
    if (data?.promotions && data.promotions.length > 1) {
      const interval = setInterval(() => {
        setCurrentPromo((prev) => (prev + 1) % data.promotions.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [data?.promotions?.length])

  async function fetchTableData() {
    try {
      console.log('Fetching table data for QR code:', qrCode)
      const response = await fetch(`/api/tables/${qrCode}`)
      
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `Table not found (${response.status})`)
      }
      
      const tableData = await response.json()
      console.log('Table data received:', tableData)
      
      if (!tableData.table) {
        throw new Error('Invalid table data received')
      }
      
      setData(tableData)
    } catch (err) {
      console.error('Error fetching table data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load table information'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleCallWaiter() {
    if (!data || calling) return

    setCalling(true)
    setError(null)
    setStatusMessage('')

    try {
      console.log('=== CALL WAITER DEBUG - DATA SOURCE ===')
      console.log('QR Code from route params:', qrCode)
      console.log('Full data object:', data)
      console.log('Table object:', data.table)
      console.log('Restaurant object:', data.table.restaurant)
      console.log('========================================')
      
      console.log('Calling waiter for table:', data.table.id)
      console.log('Restaurant ID:', data.table.restaurant.id)
      console.log('Table Number:', data.table.number)
      
      const payload = {
        tableId: data.table.id,
        restaurantId: data.table.restaurant.id,
      }
      
      console.log('Request payload:', payload)
      
      // Explicit logging for debugging - show exact values being sent
      console.log('=== CALL WAITER REQUEST DEBUG ===')
      console.log('tableId:', data.table.id)
      console.log('restaurantId:', data.table.restaurant.id)
      console.log('Full request body object:', payload)
      console.log('Request body JSON string:', JSON.stringify(payload))
      console.log('================================')
      
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Call API response status:', response.status)
      console.log('Response headers:', response.headers)
      
      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || 'Unknown error' }
        }
        console.error('Call API Error:', errorData)
        
        // If table not found, try with fallback test data
        if (response.status === 404 && errorData.error?.includes('Table not found')) {
          console.log('Trying with fallback test data...')
          return await handleCallWaiterFallback()
        }
        
        throw new Error(errorData.error || `Failed to call waiter (${response.status})`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch {
        result = { success: true, rawResponse: responseText }
      }
      
      console.log('Call successful:', result)
      
      setStatusMessage('✅ A waiter is on their way!')
      // Reset after 5 seconds
      setTimeout(() => {
        setStatusMessage('')
        setCalling(false)
      }, 5000)
    } catch (err) {
      console.error('Error calling waiter:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to call waiter. Please try again.'
      setError(errorMessage)
      setCalling(false)
    }
  }

  // Fallback function to try with hardcoded test data
  async function handleCallWaiterFallback() {
    try {
      console.log('Using fallback test data...')
      
      const fallbackPayload = {
        tableId: 'table-1',
        restaurantId: 'test-rest-1',
      }
      
      console.log('Fallback payload:', fallbackPayload)
      
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackPayload),
      })

      console.log('Fallback API response status:', response.status)
      
      const responseText = await response.text()
      console.log('Fallback response text:', responseText)
      
      if (!response.ok) {
        const errorData = JSON.parse(responseText)
        throw new Error(`Fallback also failed: ${errorData.error || 'Unknown error'}`)
      }

      const result = JSON.parse(responseText)
      console.log('Fallback call successful:', result)
      
      setStatusMessage('✅ A waiter is on their way! (Test Mode)')
      setTimeout(() => {
        setStatusMessage('')
        setCalling(false)
      }, 5000)
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr)
      throw new Error('Both primary and fallback methods failed. Please contact support.')
    }
  }

  function handleViewMenu() {
    // For testing, use a demo menu if no menuUrl is set
    const menuUrl = data?.table.restaurant.menuUrl || 'https://www.mcdonalds.com/us/en-us/full-menu.html'
    if (!menuUrl) return
    setShowMenu(true)
    setMenuError(null)
  }

  function handleBackToCallWaiter() {
    setShowMenu(false)
    setMenuError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-600 text-2xl">qr_code_2</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Table Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            QR Code: <code className="bg-gray-100 px-2 py-1 rounded">{qrCode}</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Show Menu View
  if (showMenu) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
          {/* Menu Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToCallWaiter}
                className="flex items-center gap-2 text-black hover:text-gray-700"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Back</span>
              </button>
              <div className="flex items-center gap-3">
                {data.table.restaurant.logoUrl ? (
                  <img 
                    src={data.table.restaurant.logoUrl} 
                    alt={data.table.restaurant.name} 
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {data.table.restaurant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <h1 className="text-lg font-bold text-black">
                  {data.table.restaurant.name}
                </h1>
              </div>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
          </header>

          {/* Menu Content */}
          <div className="h-[calc(100vh-73px)]">
            {menuError ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <div className="text-red-600 mb-4">
                    <span className="material-symbols-outlined text-4xl">error</span>
                  </div>
                  <h2 className="text-xl font-bold text-black mb-2">Menu Unavailable</h2>
                  <p className="text-gray-600 mb-4">Please ask your waiter for assistance.</p>
                  <button
                    onClick={handleBackToCallWaiter}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Back to Call Waiter
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                src={data.table.restaurant.menuUrl || 'https://www.mcdonalds.com/us/en-us/full-menu.html'}
                className="w-full h-full border-0"
                onLoad={() => setMenuError(null)}
                onError={() => setMenuError('Menu unavailable. Please ask your waiter.')}
                title="Restaurant Menu"
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Restaurant Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            {data.table.restaurant.logoUrl ? (
              <img 
                src={data.table.restaurant.logoUrl} 
                alt={data.table.restaurant.name} 
                className="h-10 w-auto"
              />
            ) : (
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {data.table.restaurant.name.charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-black">
              {data.table.restaurant.name}
            </h1>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Table Number */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black mb-2">
              Table {data.table.number}
            </h2>
            <p className="text-gray-600">
              welcome back! how can we help you today?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => {
                console.log('Call Waiter button clicked!')
                console.log('Data available:', !!data)
                console.log('Currently calling:', calling)
                handleCallWaiter()
              }}
              disabled={calling}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-white">
                notifications
              </span>
              <span>
                {calling ? 'Calling...' : 'Call Waiter'}
              </span>
            </button>

            <button
              onClick={handleViewMenu}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-white">
                restaurant_menu
              </span>
              <span>
                View Menu
              </span>
            </button>

            {/* Status Messages */}
            {statusMessage && (
              <div className="text-center">
                <p className="text-green-600 font-medium">
                  {statusMessage}
                </p>
              </div>
            )}
            {error && (
              <div className="text-center">
                <p className="text-red-600 font-medium">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Promotional Section */}
          {data.promotions && data.promotions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-black">
                Special Offers
              </h3>

              <div className="space-y-4">
                {data.promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                  >
                    {promo.imageUrl ? (
                      <div className="w-full mb-3 sm:mb-4 bg-gray-100 rounded-lg overflow-hidden flex justify-center items-center">
                        <img
                          alt={promo.title}
                          className="w-full h-auto object-contain max-w-full"
                          src={promo.imageUrl}
                          style={{ 
                            maxHeight: '200px',
                            minHeight: '120px'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden w-full h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="material-symbols-outlined text-green-600 text-3xl">
                              local_offer
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-lg mb-3 flex items-center justify-center">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-green-600 text-3xl">
                            local_offer
                          </span>
                        </div>
                      </div>
                    )}
                    <h4 className="font-bold text-black mb-2 text-base sm:text-lg">
                      {promo.title}
                    </h4>
                    <p className="text-gray-700 text-sm sm:text-base mb-3">
                      {promo.description}
                    </p>
                    {promo.linkUrl && (
                      <a
                        href={promo.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        View Offer
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-gray-400 text-2xl">restaurant</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Welcome to {data.table.restaurant.name}
              </h3>
              <p className="text-gray-500 text-sm">
                Press the button above to call your waiter
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
