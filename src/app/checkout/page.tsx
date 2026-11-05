'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { handleCheckout } from '@/lib/stripe-client'

function CheckoutRedirector() {
  const searchParams = useSearchParams()
  const triggered = useRef(false)

  const priceId = searchParams.get('priceId') ?? ''
  const mode = (searchParams.get('mode') ?? 'subscription') as 'payment' | 'subscription'
  const credits = parseInt(searchParams.get('credits') ?? '0', 10)

  useEffect(() => {
    // Guard against StrictMode double-fire and re-renders
    if (triggered.current || !priceId) return
    triggered.current = true

    console.log('[Checkout] Auto-triggering Stripe for priceId:', priceId)
    handleCheckout(priceId, mode, credits)
  }, [priceId, mode, credits])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 20%, #3B1D8B 0%, #1E1A5F 45%, #0B0826 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        gap: 24,
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(216,76,159,0.3)',
          borderTopColor: '#D84C9F',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, margin: 0 }}>
        Taking you to checkout…
      </p>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 60% 20%, #3B1D8B 0%, #1E1A5F 45%, #0B0826 100%)',
          }}
        />
      }
    >
      <CheckoutRedirector />
    </Suspense>
  )
}
