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
      const response = await fetch(`/api/tables/${qrCode}`)
      if (!response.ok) {
        throw new Error('Table not found')
      }
      const tableData = await response.json()
      setData(tableData)
    } catch (err) {
      setError('Table not found')
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
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: data.table.id,
          restaurantId: data.table.restaurant.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to call waiter')
      }

      setStatusMessage('A waiter is on their way.')
      // Reset after 5 seconds
      setTimeout(() => {
        setStatusMessage('')
        setCalling(false)
      }, 5000)
    } catch (err) {
      setError('Failed to call waiter. Please try again.')
      setCalling(false)
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
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Table Not Found</h1>
          <p className="text-gray-600">{error}</p>
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
              Press the button below to call for assistance
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleCallWaiter}
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
          {data.promotions && data.promotions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-black">
                Special Offers
              </h3>

              <div className="space-y-4">
                {data.promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    {promo.imageUrl ? (
                      <img
                        alt={promo.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        src={promo.imageUrl}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-lg mb-3 flex items-center justify-center">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-green-600 text-3xl">
                            local_offer
                          </span>
                        </div>
                      </div>
                    )}
                    <h4 className="font-bold text-black mb-2">
                      {promo.title}
                    </h4>
                    {promo.description && (
                      <p className="text-gray-600 text-sm">
                        {promo.description}
                      </p>
                    )}
                    {promo.linkUrl && (
                      <a
                        href={promo.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-green-600 hover:text-green-700 font-medium text-sm"
                      >
                        Learn More →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
