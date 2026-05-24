'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

  const plans = [
    {
      name: 'Starter',
      price: '19',
      features: ['2 Audits / month', 'Standard Risk Scanning'],
      missing: ['Counter-Offer Generation'],
      cta: 'Choose Starter',
      featured: false
    },
    {
      name: 'Pro',
      price: '49',
      features: ['10 Audits / month', 'Priority Risk Detection', 'AI Counter-Offer Builder', 'Discount Top-ups Available'],
      cta: 'Go Pro',
      featured: true
    },
    {
      name: 'Power',
      price: '79',
      features: ['Unlimited Audits', 'Talent Manager Hub', 'Legal Review Escalation'],
      cta: 'Choose Power',
      featured: false
    }
  ]

  return (
    <section ref={containerRef} className="py-20 px-10 bg-black" id="pricing">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline text-4xl text-on-surface font-semibold tracking-[-0.02em]">
            Precision Protection for Every Creator
          </h2>
          <p className="text-lg text-on-surface-variant mt-4">Simple pricing. No hidden fees. Legal-grade security.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`reveal-pricing glass-card rounded-2xl p-8 flex flex-col hover:scale-[1.05] transition-transform duration-300 relative overflow-hidden ${
                plan.featured ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-primary px-4 py-1 text-on-primary text-[10px] tracking-widest font-bold uppercase">
                  Most Popular
                </div>
              )}
              <h3 className="font-headline text-xl font-medium tracking-[-0.02em]">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-on-surface-variant text-xs font-mono uppercase">/mo</span>
              </div>
              <ul className="mt-8 flex flex-col gap-4 flex-grow">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px]">check</span>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
                {plan.missing?.map((m, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline text-[20px]">close</span>
                    <span className="text-sm text-on-surface-variant">{m}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/plans" 
                className={`mt-8 w-full py-3 rounded-full font-bold transition-all text-center block ${
                  plan.featured 
                    ? 'bg-primary text-on-primary hover:brightness-110' 
                    : 'border border-outline-variant hover:bg-surface-variant'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center mt-12 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
          Note: Subscribers get discount top-ups for high-volume months.
        </p>
      </div>
    </section>
  )
}
