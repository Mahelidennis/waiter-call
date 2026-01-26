'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  restaurantName: string
  phone: string
  address: string
  adminName: string
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
    adminName: '',
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

    // Validate step 2
    if (!form.adminEmail.trim() || !form.adminPassword.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (!form.acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: form.restaurantName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          phone: form.phone,
          address: form.address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      if (data.success) {
        if (data.requiresLogin) {
          // Auto-login failed, redirect to login
          router.push('/auth/admin')
        } else {
          // Auto-login successful, redirect to success page
          router.push('/auth/admin/success')
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = currentStep === 1 ? 50 : 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-4">
            <span className="text-white font-bold text-xl">●</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Join WaiterCall</h1>
          <p className="text-gray-600">Set up your restaurant account in just a few minutes.</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">
              {currentStep === 1 ? 'Step 1 of 2: Restaurant details' : 'Step 2 of 2: Account setup'}
            </span>
            <span className="text-sm font-medium text-primary">
              {currentStep === 1 ? '50%' : '100%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step 1: Restaurant Details */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={form.restaurantName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter your restaurant name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="(555) 123-4567"
                  />
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

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Admin Account Setup */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={form.adminName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={form.adminEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="admin@restaurant.com"
                    required
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
                      placeholder="Create a strong password"
                      required
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
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

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 mb-3">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                  </div>
                  <p className="text-gray-600">Setting up your account...</p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                >
                  Complete Registration
                </button>
              )}
            </form>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/admin')}
                className="text-primary font-medium hover:text-primary/80 transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


