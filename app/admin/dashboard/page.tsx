'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

interface Restaurant {
  id: string
  name: string
  slug: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuthAndRedirect() {
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
          router.push('/auth/admin')
          return
        }

        // Fetch restaurant for this admin
        const response = await fetch('/api/restaurants/user')

        if (!response.ok) {
          router.push('/auth/admin')
          return
        }

        const restaurant: Restaurant = await response.json()
        
        // Redirect to the actual restaurant dashboard
        router.push(`/admin/${restaurant.id}`)
      } catch (error) {
        router.push('/auth/admin')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
