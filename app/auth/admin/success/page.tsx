'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

interface Restaurant {
  id: string
  name: string
}

export default function AdminSuccessPage() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuthAndFetchRestaurant() {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return document.cookie
                  .split('; ')
                  .find(row => row.startsWith(name + '='))
                  ?.split('=')[1]
              }
            }
          }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          // Don't redirect immediately - show a message instead
          console.log('User not authenticated, showing success page anyway')
          setRestaurant({ id: 'temp', name: 'Your Restaurant' })
          setLoading(false)
          return
        }

        // Fetch restaurant for this admin
        const response = await fetch('/api/restaurants/user')

        if (!response.ok) {
          router.push('/auth/admin')
          return
        }

        const restaurantData = await response.json()
        setRestaurant(restaurantData)
      } catch (error) {
        router.push('/auth/admin')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchRestaurant()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Unable to load restaurant information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <span className="text-white text-4xl">✓</span>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Account Created Successfully! 🎉
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your restaurant account has been set up successfully. You can now log in to access your dashboard and start managing your tables.
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 mb-4"
          >
            Go to Dashboard
          </button>

          {/* Secondary Link */}
          <div className="text-center">
            <button
              onClick={() => router.push('/admin/tables')}
              className="text-primary font-medium hover:text-primary/80 transition-colors duration-200"
            >
              Or, start generating QR codes for your tables
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  )
}
