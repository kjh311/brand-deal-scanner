'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import gsap from 'gsap'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      router.replace('/plans')
      return
    }

    // Small delay to allow the webhook to likely finish
    const timer = setTimeout(() => {
      setIsVerifying(false)
      
      // Success animation
      gsap.from(".success-card", {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      })
      
      gsap.from(".success-icon", {
        scale: 0,
        rotation: -45,
        duration: 0.8,
        delay: 0.2,
        ease: "elastic.out(1, 0.5)"
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [sessionId, router])

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium animate-pulse">Confirming your payment...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-20 px-6">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-10 text-center text-[#1E1A5F] shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D84C9F]/10 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#7B2CBF]/10 blur-[80px] rounded-full" />

        <div className="w-20 h-20 bg-[#D84C9F]/10 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
          <span className="material-symbols-outlined text-[#D84C9F] text-5xl font-bold">
            check
          </span>
        </div>

        <h1 className="font-headline text-4xl font-bold mb-4 text-[#1E1A5F] tracking-tight">
          Payment Successful!
        </h1>
        
        <p className="text-[#64748B] text-lg mb-10 leading-relaxed max-w-md mx-auto">
          We've updated your account and your credits are now ready. You can start scanning contracts immediately.
        </p>

        <div className="flex flex-col gap-4 relative z-10">
          <Link 
            href="/upload"
            className="w-full py-4 bg-[#D84C9F] text-white rounded-2xl font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            Start Scanning
          </Link>
          
          <Link 
            href="/dashboard"
            className="w-full py-4 bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E1A5F] rounded-2xl font-semibold hover:bg-white transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </div>
      
      <p className="text-center mt-8 text-[#64748B]/60 text-sm">
        A receipt has been sent to your email.
      </p>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">

      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
