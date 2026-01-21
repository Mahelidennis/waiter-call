'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Restaurant = {
  id: string
  name: string
  slug: string
}

export default function WaiterLoginPage() {
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
    setLoading(true)

    try {
      const payload: Record<string, string> = { accessCode }
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

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Login failed')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waiter Access</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Enter your restaurant code and access PIN to start.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Restaurant
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={selectedRestaurantId}
                onChange={(e) => {
                  setSelectedRestaurantId(e.target.value)
                  setRestaurantCode('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
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
              className="w-full px-3 py-2 tracking-widest text-center text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {restaurantDisplay && (
          <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
            Logging into: <span className="font-semibold">{restaurantDisplay}</span>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Need help? Ask your manager to reset your access code.
        </p>
      </div>
    </div>
  )
}

