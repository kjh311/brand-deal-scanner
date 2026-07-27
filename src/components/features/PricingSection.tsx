'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface PricingPlan {
  name: string
  price: string
  period: string
  badge?: string
  color: string
  icon: string
  scans: string
  features: string[]
  cta: string
  featured?: boolean
}

export function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from(".reveal-pricing", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const plans: PricingPlan[] = [
    {
      name: 'Individual Creator',
      price: '5',
      period: '/scan',
      color: '#FF4D4D',
      icon: 'build',
      scans: '1 SCAN',
      features: [
        'Red Flag Analysis',
        'Red Flag Analysis & Explanations',
        'Counter-Offer Generator',
        'Advanced Missing Clause Detection AI',
        'Brand-Specific Insight Reports',
      ],
      cta: 'Select Plan',
      featured: false,
    },
    {
      name: 'Creator Plus',
      price: '15',
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
      cta: 'Select Plan',
      featured: false,
    },
    {
      name: 'Creator Professional',
      price: '29',
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
      cta: 'Select Plan',
      featured: true,
    },
    {
      name: 'AG Agency',
      price: '79',
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
      cta: 'Select Plan',
      featured: false,
    },
  ]

  return (
    <section ref={containerRef} className="py-16 sm:py-20 px-5 sm:px-10 bg-transparent" id="pricing">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em]">
            Precision Protection for Every Creator
          </h2>
          <p className="text-lg text-white/70 mt-4">Simple pricing. No hidden fees. Legal-grade security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className="plan-card bg-white border-[3px] rounded-2xl p-6 flex flex-col h-full shadow-2xl relative cursor-pointer hover:shadow-[0_0_25px_var(--glow-color),_0_0_45px_var(--glow-color)] transition-shadow duration-300"
              style={{
                borderColor: plan.color + '60',
                '--glow-color': plan.color + '55'
              } as React.CSSProperties}
            >
              {plan.featured && (
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
                <h3 className="font-mono text-xs uppercase tracking-[2px] font-bold mb-2 text-[#1E1A5F]" style={{ color: plan.color }}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-headline text-4xl font-semibold tracking-tight text-[#1E1A5F]">{plan.price}</span>
                  <span className="text-[#64748B] text-sm font-medium">{plan.period}</span>
                </div>
                {plan.period.includes('/mo') && (
                  <p className="text-[10px] text-[#64748B]/60 mt-0.5 font-medium">(Billed monthly)</p>
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
                    <span className="text-[#1E1A5F] font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/plans"
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.985] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 active:brightness-90 transition-all"
                style={{ backgroundColor: plan.color, color: '#131313' }}
              >
                {plan.cta}
              </Link>
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
    </section>
  )
}