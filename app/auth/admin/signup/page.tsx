'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  restaurantName: string
  phone: string
  address: string
  adminEmail: string
  adminPassword: string
  acceptTerms: boolean
}

export default function AdminSignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<FormData>({
    restaurantName: '',
    phone: '',
    address: '',
    adminEmail: '',
    adminPassword: '',
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = event.target
    setForm((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value 
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (currentStep === 1) {
      // Validate step 1
      if (!form.restaurantName.trim()) {
        setError('Restaurant name is required')
        return
      }
      setCurrentStep(2)
      return
    }

    // Step 2 - Complete signup
    if (!form.adminEmail.trim() || !form.adminPassword.trim()) {
      setError('Email and password are required')
      return
    }

    if (!form.acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setLoading(true)

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000)
      })

      const response = await Promise.race([
        fetch('/api/auth/admin/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantName: form.restaurantName,
            phone: form.phone,
            address: form.address,
            adminEmail: form.adminEmail,
            adminPassword: form.adminPassword,
          }),
        }),
        timeoutPromise,
      ])

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        throw new Error('Server returned an invalid response. Please try again.')
      }

      if (!response.ok) {
        const serverError = result?.error || `Server error (${response.status}). Please try again.`
        throw new Error(serverError)
      }

      // Show loading state before redirect
      setLoading(false)
      // Brief success state then redirect
      setTimeout(() => {
        router.push('/auth/admin')
      }, 2000)
    } catch (err) {
      let errorMessage = 'Failed to create account. Please try again.'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      if (errorMessage.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const progressPercentage = currentStep === 1 ? 50 : 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of 2 — {currentStep === 1 ? 'Restaurant details' : 'Admin access'}
            </span>
            <span className="text-sm font-medium text-primary">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step 1: Restaurant Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Tell us about your restaurant
                </h1>
                <p className="text-gray-600">
                  We'll use this to create your restaurant workspace.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Restaurant Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Restaurant name
                        </label>
                        <input
                          type="text"
                          name="restaurantName"
                          value={form.restaurantName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                          required
                          placeholder="e.g., Sunset Bistro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                          placeholder="+1 (555) 123-4567"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used for important account notifications
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                          placeholder="123 Main Street, City, State 12345"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Continue
                  </button>
                  <p className="text-sm text-gray-500 text-center">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/auth/admin')}
                      className="text-primary font-medium hover:text-primary/80 transition-colors duration-200"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Admin Account Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Create your admin account
                </h1>
                <p className="text-gray-600">
                  This account will manage your restaurant, staff, and settings.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
                    <div className="w-6 h-6 rounded-full bg-primary animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Setting up your restaurant...
                  </h3>
                  <p className="text-gray-600">
                    You'll be taken to your dashboard next
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Admin Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email address
                          </label>
                          <input
                            type="email"
                            name="adminEmail"
                            value={form.adminEmail}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            required
                            placeholder="admin@restaurant.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="adminPassword"
                              value={form.adminPassword}
                              onChange={handleChange}
                              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                              required
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                              {showPassword ? (
                                <span className="material-symbols-outlined text-xl">visibility_off</span>
                              ) : (
                                <span className="material-symbols-outlined text-xl">visibility</span>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Use at least 8 characters
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        id="acceptTerms"
                        checked={form.acceptTerms}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        required
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                        I agree to the Terms of Service and Privacy Policy
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      className="w-full py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Finish setup
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      You'll be taken to your dashboard next
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      >
                        ← Back
                      </button>
                      <span className="text-gray-400">•</span>
                      <button
                        type="button"
                        onClick={() => router.push('/auth/admin')}
                        className="text-primary font-medium hover:text-primary/80 transition-colors duration-200"
                      >
                        Sign in instead
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


