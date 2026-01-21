'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LegacyWaiterAuthRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    const redirect = searchParams.get('redirect')
    const target = redirect
      ? `/waiter/login?redirect=${encodeURIComponent(redirect)}`
      : '/waiter/login'
    router.replace(target)
  }, [router, searchParams])

  return null
}

