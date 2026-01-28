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

        // CRITICAL: User must be authenticated to reach this page
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('❌ Success page accessed without authentication:', authError?.message)
          // This should never happen - redirect to login immediately
          router.push('/auth/admin')
          return
        }

        // CRITICAL: Extract restaurantId from user metadata
        const restaurantId = user.user_metadata?.restaurantId || user.app_metadata?.restaurantId

        if (!restaurantId) {
          console.error('❌ No restaurantId found in user metadata')
          router.push('/auth/admin')
          return
        }

        console.log('✅ User authenticated with restaurantId:', restaurantId)

        // Set restaurant from session data
        setRestaurant({
          id: restaurantId,
          name: user.user_metadata?.restaurantName || 'Your Restaurant'
        })

      } catch (error) {
        console.error('❌ Error in success page:', error)
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
            Welcome to Your Restaurant! 🎉
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your restaurant account has been set up successfully. You're now ready to start managing your tables and serving your customers better.
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => {
              // CRITICAL: Navigate using session restaurantId
              const restaurantId = restaurant?.id
              if (restaurantId) {
                console.log('🚀 Navigating to dashboard with restaurantId:', restaurantId)
                router.push(`/admin/${restaurantId}`)
              } else {
                console.error('❌ No restaurantId available for navigation')
                router.push('/auth/admin')
              }
            }}
            className="w-full py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 mb-4"
          >
            Go to Dashboard
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => {
              const restaurantId = restaurant?.id
              if (restaurantId) {
                router.push(`/admin/${restaurantId}/tables`)
              } else {
                router.push('/auth/admin')
              }
            }}
            className="w-full py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          >
            Generate Table QR Codes
          </button>
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
