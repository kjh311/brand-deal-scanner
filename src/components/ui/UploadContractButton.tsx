'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface UploadContractButtonProps {
  className?: string
  children?: React.ReactNode
  icon?: React.ReactNode
}

/**
 * UploadContractButton enforces the application access gates:
 * 1. Auth Check: If not logged in, redirects immediately to /login.
 * 2. Plan & Scan Balance Check: If logged in with available credits, proceeds to /upload.
 * 3. Active Plan vs No Plan:
 *    - If user has active subscription but 0 credits, opens /upload?topup=true.
 *    - If user has no active plan, subscription, or credits, redirects to /plans.
 */
export function UploadContractButton({
  className = '',
  children = 'Upload Contract',
  icon,
}: UploadContractButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUploadClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 1. Authentication Check
      if (!user) {
        router.push('/login')
        return
      }

      // 2. Plan & Scan Credit Check
      const res = await fetch('/api/subscription-status')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        router.push('/plans')
        return
      }

      const data = await res.json()
      const userCredits = (data.credits || 0) + (data.none_expire_credits || 0)
      const hasActiveSub =
        Boolean(data.hasActiveSubscription) ||
        Boolean(data.currentPeriodEnd) ||
        (Boolean(data.plan) &&
          data.plan.toLowerCase() !== 'free' &&
          data.plan.toLowerCase() !== 'none')

      // 3. Routing decision
      if (userCredits > 0) {
        router.push('/upload')
      } else if (hasActiveSub && data.stripe_customer_id) {
        router.push('/upload?topup=true')
      } else {
        router.push('/plans')
      }
    } catch (err) {
      console.error('Error verifying upload access:', err)
      router.push('/plans')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUploadClick}
      disabled={loading}
      type="button"
      className={className}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying access...</span>
        </span>
      ) : (
        <>
          <span>{children}</span>
          {icon}
        </>
      )}
    </button>
  )
}

