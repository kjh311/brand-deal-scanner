'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { handleCheckout, CheckoutMode } from '@/lib/stripe-client'
import gsap from 'gsap'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  badge?: string
  color: string
  icon: string
  scans: string
  features: string[]
  priceId: string
  mode: CheckoutMode
  credits: number
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'individual',
    name: 'INDIVIDUAL CREATOR',
    price: '$5',
    period: 'PER SCAN',
    color: '#FF4D4D',
    icon: 'build',
    scans: '1 SCAN ONLY',
    features: [
      'Red Flag Analysis',
      'Red Flag Analysis & Explanations',
      'Counter-Offer Generator',
      'Advanced Missing Clause Detection AI',
      'Brand-Specific Insight Reports',
    ],
    priceId: 'prod_Ueztggr15cNscz',
    mode: 'payment',
    credits: 1,
  },
  {
    id: 'plus',
    name: 'CREATOR PLUS',
    price: '$15',
    period: '/mo',
    color: '#00C853',
    icon: 'bomb',
    scans: '5 SCANS / MONTH',
    features: [
      'Red Flag Analysis',
      'Red Flag Analysis & Explanations',
      'Counter-Offer Generator',
      'Advanced Missing Clause Detection AI',
      'Brand-Specific Insight Reports',
    ],
    priceId: 'prod_Uezx3sCcamylDq',
    mode: 'subscription',
    credits: 5,
  },
  {
    id: 'professional',
    name: 'CREATOR PROFESSIONAL',
    price: '$29',
    period: '/mo',
    color: '#FFD700',
    icon: 'auto_awesome',
    scans: '20 SCANS / MONTH',
    features: [
      'Red Flag Analysis',
      'Red Flag Analysis & Explanations',
      'Counter-Offer Generator',
      'Advanced Missing Clause Detection AI',
      'Brand-Specific Insight Reports',
    ],
    priceId: 'prod_Uf01XdkL0cOXn6',
    mode: 'subscription',
    credits: 20,
    popular: true,
  },
  {
    id: 'agency',
    name: 'AG AGENCY',
    price: '$79',
    period: '/mo',
    color: '#2196F3',
    icon: 'diamond',
    scans: '100 SCANS / MONTH',
    features: [
      'Red Flag Analysis',
      'Red Flag Analysis & Explanations',
      'Counter-Offer Generator',
      'Advanced Missing Clause Detection AI',
      'Full Dashboard History Access',
    ],
    priceId: 'prod_Uf03Msy5G3OZn2',
    mode: 'subscription',
    credits: 100,
  },
]

export default function PlansPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const isRedirecting = useRef(false)

  useEffect(() => {
    // Force reset everything on mount/visibility change
    const reset = () => {
      console.log('Plans: Resetting state')
      isRedirecting.current = false
      setLoadingPlanId(null)
    }

    reset()

    window.addEventListener('pageshow', reset)
    window.addEventListener('focus', reset)

    const ctx = gsap.context(() => {
      // Set initial state
      gsap.set(".plan-card", { opacity: 0, y: 30 });
      
      // Animate to final state
      gsap.to(".plan-card", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      })
    }, containerRef)

    return () => {
      window.removeEventListener('pageshow', reset)
      window.removeEventListener('focus', reset)
      ctx.revert()
    }
  }, [])

  const handleSelect = async (plan: Plan) => {
    console.log('Plans: Attempting to select plan', plan.id)
    if (loadingPlanId || isRedirecting.current) {
      console.log('Plans: Selection blocked - already loading or redirecting')
      return
    }

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('Plans: No user found, redirecting to signup')
      router.push(`/signup?plan=${plan.id}`)
      return
    }

    console.log('Plans: Starting checkout for', plan.id)
    isRedirecting.current = true
    setLoadingPlanId(plan.id)

    try {
      await handleCheckout(plan.priceId, plan.mode, plan.credits)
      // Note: If redirect happens, execution might stop here
    } catch (err) {
      console.error('Plans: Checkout failed', err)
      setLoadingPlanId(null)
      isRedirecting.current = false
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-on-surface">
      {/* Colorful blurred glassmorphism background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]/75" />
        <div className="absolute -top-1/4 -left-1/4 w-[700px] h-[700px] rounded-full bg-primary/35 blur-[140px]" />
        <div className="absolute top-1/3 -right-1/4 w-[550px] h-[550px] rounded-full bg-secondary/30 blur-[120px]" />
        <div className="absolute -bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-tertiary/25 blur-[130px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-12 px-6 shadow-2xl">
        <div ref={containerRef} className="max-w-[1120px] mx-auto">
          {/* Hero Title */}
          <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-[-0.02em] uppercase mb-4 text-white">
              Brand Deal Scanner: Premier Plans
            </h1>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg leading-relaxed">
              Precise legal analysis and AI-driven risk assessment for high-volume content creators and agencies.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handleSelect(plan)}
                className="plan-card glass-panel rounded-2xl p-6 flex flex-col h-full border-[3px] shadow-2xl relative cursor-pointer hover:shadow-[0_0_25px_var(--glow-color),_0_0_45px_var(--glow-color)] transition-shadow duration-300"
                style={{
                  borderColor: plan.color + '60',
                  '--glow-color': plan.color + '55'
                } as any}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest shadow-lg uppercase whitespace-nowrap"
                      style={{ backgroundColor: plan.color, color: '#131313' }}
                    >
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6 text-center">
                  <span
                    className="material-symbols-outlined text-[40px] mb-3 block animate-pulse"
                    style={{ color: plan.color }}
                  >
                    {plan.icon}
                  </span>
                  <h3 className="font-mono text-xs uppercase tracking-[2px] font-bold mb-2" style={{ color: plan.color }}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-headline text-4xl font-semibold tracking-tight text-white">{plan.price}</span>
                    <span className="text-on-surface-variant text-sm font-medium">{plan.period}</span>
                  </div>
                  {plan.period.includes('/mo') && (
                    <p className="text-[10px] text-on-surface-variant/60 mt-0.5 font-medium">(Billed monthly)</p>
                  )}
                </div>

                <div
                  className="border-y py-2 text-center mb-6 text-xs font-mono uppercase tracking-wider font-bold"
                  style={{ borderColor: plan.color + '30', color: plan.color }}
                >
                  {plan.scans}
                </div>

                <ul className="flex-grow space-y-3 mb-8 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: plan.color }}>
                        check_circle
                      </span>
                      <span className="text-on-surface-variant font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(plan)
                  }}
                  disabled={loadingPlanId !== null}
                  className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.985] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 active:brightness-90 transition-all"
                  style={{ backgroundColor: plan.color, color: '#131313' }}
                >
                  {loadingPlanId === plan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#131313] border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-on-surface-variant/60 max-w-md mx-auto font-medium">
              All plans include encrypted processing. No contracts. Cancel anytime.
              One-time scans never expire.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
