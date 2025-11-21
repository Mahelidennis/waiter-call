'use client'

import { supabase } from '@/lib/supabase/client'

type EmailPasswordPayload = {
  email: string
  password: string
}

export async function signInWithEmailPassword(payload: EmailPasswordPayload) {
  const { email, password } = payload
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signUpWithEmailPassword(
  payload: EmailPasswordPayload & {
    metadata?: Record<string, unknown>
  }
) {
  const { email, password, metadata } = payload
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({
    password: newPassword,
  })
}

export async function signOutClient() {
  return supabase.auth.signOut()
}




