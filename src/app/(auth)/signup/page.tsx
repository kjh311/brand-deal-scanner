'use client'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AuthCard } from '@/components/features/AuthCard'

export default function SignupPage() {
  return (
    <AuthLayout variant="signup">
      <AuthCard mode='signup' />
    </AuthLayout>
  )
}
