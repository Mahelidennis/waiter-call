'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    restaurantName: '',
    adminEmail: '',
    adminPassword: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000) // 30 second timeout
      })

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch('/api/auth/admin/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }),
        timeoutPromise,
      ])

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        // If response is not JSON, it might be an error
        throw new Error('Server returned an invalid response. Please try again.')
      }

      if (!response.ok) {
        // Use the error message from the server if available
        const serverError = result?.error || `Server error (${response.status}). Please try again.`
        throw new Error(serverError)
      }

      setSuccess('Admin account created successfully. You can now sign in.')
      setTimeout(() => {
        router.push('/auth/admin')
      }, 1500)
    } catch (err) {
      let errorMessage = 'Failed to sign up. Please check your connection and try again.'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        errorMessage = 'Request timed out. This might be due to slow network or server issues. Please try again.'
      } else if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please use a different email or sign in instead.'
      } else if (errorMessage.includes('configuration error') || errorMessage.includes('contact support')) {
        errorMessage = 'Server configuration error. Please contact support or try again later.'
      } else if (errorMessage.includes('Database connection')) {
        errorMessage = 'Database connection error. Please try again in a moment.'
      }
      
      setError(errorMessage)
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Restaurant Admin Account
        </h1>
        <p className="text-gray-600 mb-6">
          This will create a new restaurant workspace plus an admin login.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                placeholder="e.g., Sunset Bistro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+1 555 123 4567"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Street, City, State"
            />
          </div>

          <hr className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email *
              </label>
              <input
                type="email"
                name="adminEmail"
                value={form.adminEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                placeholder="owner@restaurant.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password *
              </label>
              <input
                type="password"
                name="adminPassword"
                value={form.adminPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Admin Account'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/auth/admin')}
            className="text-indigo-600 font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  )
}


