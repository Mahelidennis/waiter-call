'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LegacyWaiterAuthRedirectInner() {
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

export default function LegacyWaiterAuthRedirect() {
  return (
    <Suspense fallback={null}>
      <LegacyWaiterAuthRedirectInner />
    </Suspense>
  )
}

