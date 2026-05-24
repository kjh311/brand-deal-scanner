'use client'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AuthCard } from '@/components/features/AuthCard'

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard mode='login' />
    </AuthLayout>
  )
}
