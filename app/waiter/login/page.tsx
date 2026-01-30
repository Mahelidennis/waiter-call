'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Restaurant = {
  id: string
  name: string
  slug: string
}

export default function WaiterLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
            Loading...
          </div>
        </div>
      }
    >
      <WaiterLoginInner />
    </Suspense>
  )
}

function WaiterLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantCode, setRestaurantCode] = useState('')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPhone, setResetPhone] = useState('')
  const [resetName, setResetName] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const res = await fetch('/api/restaurants')
        if (!res.ok) return
        const data = await res.json()
        setRestaurants(data)
      } catch (err) {
        console.error('Failed to load restaurants', err)
      }
    }
    loadRestaurants()
  }, [])

  const restaurantDisplay = useMemo(() => {
    if (restaurantCode) {
      return restaurantCode
    }
    const selected = restaurants.find((r) => r.id === selectedRestaurantId)
    return selected ? selected.name : ''
  }, [restaurantCode, restaurants, selectedRestaurantId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    // Client-side validation
    if (!accessCode || accessCode.trim().length < 4) {
      setError('Please enter a valid access code (4-8 digits)')
      return
    }
    
    if (!restaurantCode && !selectedRestaurantId) {
      setError('Please select a restaurant or enter a restaurant code')
      return
    }
    
    setLoading(true)

    try {
      const payload: Record<string, string> = { accessCode: accessCode.trim() }
      if (restaurantCode) {
        payload.restaurantCode = restaurantCode.trim()
      } else if (selectedRestaurantId) {
        payload.restaurantId = selectedRestaurantId
      }

      const res = await fetch('/api/auth/waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // Guard against non-JSON/empty error responses (otherwise we get "Unexpected end of JSON input")
      const contentType = res.headers.get('content-type') || ''
      const raw = await res.text()
      const data =
        contentType.includes('application/json') && raw
          ? (JSON.parse(raw) as any)
          : {}
      if (!res.ok) {
        throw new Error(
          (data && typeof data.error === 'string' && data.error) ||
            raw ||
            'Login failed'
        )
      }

      const target =
        redirect ||
        (data.waiter?.id ? `/waiter/${data.waiter.id}` : '/waiter/login')
      router.replace(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetAccessCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResetError(null)
    setResetSuccess(null)
    
    // Client-side validation
    if (!resetEmail && !resetPhone && !resetName) {
      setResetError('Please provide at least one field to identify your account')
      return
    }
    
    if (!restaurantCode && !selectedRestaurantId) {
      setResetError('Please select a restaurant or enter a restaurant code')
      return
    }
    
    setResetLoading(true)

    try {
      const payload: Record<string, string> = {}
      if (resetEmail) payload.email = resetEmail.trim()
      if (resetPhone) payload.phone = resetPhone.trim()
      if (resetName) payload.name = resetName.trim()
      if (restaurantCode) {
        payload.restaurantCode = restaurantCode.trim()
      } else if (selectedRestaurantId) {
        payload.restaurantId = selectedRestaurantId
      }

      const res = await fetch('/api/auth/waiter/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const contentType = res.headers.get('content-type') || ''
      const raw = await res.text()
      const data =
        contentType.includes('application/json') && raw
          ? (JSON.parse(raw) as any)
          : {}
      
      if (!res.ok) {
        throw new Error(
          (data && typeof data.error === 'string' && data.error) ||
            raw ||
            'Reset failed'
        )
      }

      setResetSuccess(`Access code reset successfully! ${data.newAccessCode ? `Your new code is: ${data.newAccessCode}` : 'Check your email/phone for the new code.'}`)
      
      // Clear form
      setResetEmail('')
      setResetPhone('')
      setResetName('')
      
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 sm:p-8 space-y-6 pb-[env(safe-area-inset-bottom)] border border-gray-200">
        {/* Logo and Brand Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Waitercall Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Waitercall</h1>
            <p className="text-gray-600 mt-1 text-sm font-medium">Waiter Access/Login</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">Enter your credentials</h2>
          <p className="text-gray-800 mt-2 text-base font-medium">
            Enter your restaurant code and access PIN to start.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Restaurant
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={selectedRestaurantId}
                onChange={(e) => {
                  setSelectedRestaurantId(e.target.value)
                  setRestaurantCode('')
                }}
                className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white"
              >
                <option value="">Select restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm font-medium text-gray-700">
              Or type restaurant code
            </p>
            <input
              type="text"
              value={restaurantCode}
              onChange={(e) => {
                setRestaurantCode(e.target.value)
                if (e.target.value) setSelectedRestaurantId('')
              }}
              placeholder="Restaurant code or slug"
              className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white placeholder-gray-500"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Access Code
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="6-digit PIN"
              className="w-full px-4 py-3 h-12 tracking-widest text-center text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!restaurantCode && !selectedRestaurantId) || !accessCode}
            className="w-full py-4 h-14 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[44px] text-lg shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {restaurantDisplay && (
          <div className="rounded-lg bg-green-50 border-2 border-green-200 px-4 py-3 text-sm font-semibold text-green-800">
            Logging into: <span className="font-bold">{restaurantDisplay}</span>
          </div>
        )}

        <p className="text-xs text-gray-600 font-medium text-center">
          Forgot your access code? 
          <button 
            onClick={() => setShowReset(true)}
            className="text-indigo-600 hover:text-indigo-800 font-semibold ml-1"
          >
            Reset it here
          </button>
        </p>

        {/* Reset Access Code Modal/Section */}
        {showReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Reset Access Code</h2>
                <button 
                  onClick={() => {
                    setShowReset(false)
                    setResetError(null)
                    setResetSuccess(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {resetSuccess && (
                <div className="rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 mb-4">
                  {resetSuccess}
                </div>
              )}

              {resetError && (
                <div className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 mb-4">
                  {resetError}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleResetAccessCode}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Restaurant
                  </label>
                  <select
                    value={selectedRestaurantId}
                    onChange={(e) => {
                      setSelectedRestaurantId(e.target.value)
                      setRestaurantCode('')
                    }}
                    className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white"
                  >
                    <option value="">Select restaurant</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm font-medium text-gray-700">
                    Or type restaurant code
                  </p>
                  <input
                    type="text"
                    value={restaurantCode}
                    onChange={(e) => {
                      setRestaurantCode(e.target.value)
                      if (e.target.value) setSelectedRestaurantId('')
                    }}
                    placeholder="Restaurant code or slug"
                    className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={resetName}
                    onChange={(e) => setResetName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 h-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                <p className="text-xs text-gray-600 font-medium">
                  Provide at least one field above to identify your account.
                </p>

                <button
                  type="submit"
                  disabled={resetLoading || (!restaurantCode && !selectedRestaurantId) || (!resetEmail && !resetPhone && !resetName)}
                  className="w-full py-4 h-14 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[44px] text-lg shadow-lg"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Access Code'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

