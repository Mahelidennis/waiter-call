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
    if (!data?.table.restaurant.menuUrl) return
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
      <div className="min-h-screen bg-white">
        {/* Menu Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleBackToCallWaiter}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back to Call Waiter</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {data.table.restaurant.name}
          </h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </header>

        {/* Menu Content */}
        <div className="h-[calc(100vh-73px)]">
          {menuError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="text-red-600 mb-4">
                  <span className="material-symbols-outlined text-4xl">error</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Menu Unavailable</h2>
                <p className="text-gray-600 mb-4">Please ask your waiter for assistance.</p>
                <button
                  onClick={handleBackToCallWaiter}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Back to Call Waiter
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={data.table.restaurant.menuUrl}
              className="w-full h-full border-0"
              onLoad={() => setMenuError(null)}
              onError={() => setMenuError('Menu unavailable. Please ask your waiter.')}
              title="Restaurant Menu"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5 sm:px-6 lg:px-8">
          <div className="layout-content-container flex flex-col w-full max-w-md flex-1">
            {/* TopNavBar */}
            <header className="flex items-center justify-center whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-700 px-10 py-4">
              <div className="flex items-center gap-4 text-[#111813] dark:text-white">
                <div className="size-6 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path
                      clipRule="evenodd"
                      d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-[#111813] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                  {data.table.restaurant.name}
                </h2>
              </div>
            </header>

            <main className="flex-grow p-4 md:p-6 space-y-8">
              {/* Main content card */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm p-6 md:p-8 text-center space-y-6">
                {/* PageHeading */}
                <div className="flex flex-col gap-2">
                  <p className="text-[#111813] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    Your Table: {data.table.number}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                    Press the button below to call for assistance
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleCallWaiter}
                    disabled={calling}
                    className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-primary text-[#111813] gap-3 text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 active:bg-primary/80 transition-colors duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 dark:disabled:text-gray-400"
                  >
                    <span className="material-symbols-outlined text-[#111813]">
                      notifications
                    </span>
                    <span className="truncate">
                      {calling ? 'Calling...' : 'Call Waiter'}
                    </span>
                  </button>

                  {/* View Menu Button - Only show if menuUrl exists */}
                  {data.table.restaurant.menuUrl && (
                    <button
                      onClick={handleViewMenu}
                      className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 border-2 border-gray-300 text-gray-700 gap-3 text-lg font-bold leading-normal tracking-[0.015em] hover:border-gray-400 hover:bg-gray-50 active:border-gray-500 transition-colors duration-200"
                    >
                      <span className="material-symbols-outlined">
                        restaurant_menu
                      </span>
                      <span className="truncate">
                        View Menu
                      </span>
                    </button>
                  )}

                  {/* BodyText for status */}
                  {statusMessage && (
                    <p className="text-green-600 dark:text-green-400 text-base font-medium leading-normal h-6">
                      {statusMessage}
                    </p>
                  )}
                  {error && (
                    <p className="text-red-600 dark:text-red-400 text-base font-medium leading-normal h-6">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              {/* Promotional Section */}
              {data.promotions && data.promotions.length > 0 && (
                <div className="space-y-4">
                  {/* SectionHeader */}
                  <h2 className="text-[#111813] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] px-4">
                    Exclusive Offers
                  </h2>

                  {/* Promotional Carousel */}
                  <div className="relative w-full">
                    <div className="flex space-x-4 overflow-x-auto pb-4 px-4 -mx-4 scrollbar-hide">
                      {data.promotions.map((promo) => (
                        <div
                          key={promo.id}
                          className="flex-shrink-0 w-64 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm overflow-hidden"
                        >
                          {promo.imageUrl ? (
                            <img
                              alt={promo.title}
                              className="w-full h-36 object-cover"
                              src={promo.imageUrl}
                            />
                          ) : (
                            <div className="w-full h-36 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <div className="text-center px-4">
                                <h3 className="font-bold text-[#111813] dark:text-white text-lg">
                                  {promo.title}
                                </h3>
                              </div>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-bold text-[#111813] dark:text-white">
                              {promo.title}
                            </h3>
                            {promo.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {promo.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
