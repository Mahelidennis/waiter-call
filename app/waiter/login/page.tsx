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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 sm:p-8 space-y-6 pb-[env(safe-area-inset-bottom)] border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waiter Access</h1>
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

        <p className="text-xs text-gray-600 font-medium">
          Need help? Ask your manager to reset your access code.
        </p>
      </div>
    </div>
  )
}

