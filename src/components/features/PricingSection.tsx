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
    <section ref={containerRef} className="py-20 px-10 bg-transparent" id="pricing">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline text-4xl text-[#1E1A5F] font-bold tracking-[-0.02em]">
            Precision Protection for Every Creator
          </h2>
          <p className="text-lg text-[#64748B] mt-4">Simple pricing. No hidden fees. Legal-grade security.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`reveal-pricing bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 flex flex-col hover:scale-[1.05] transition-transform duration-300 relative overflow-hidden text-[#1E1A5F] ${
                plan.featured ? 'ring-2 ring-[#D84C9F]' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-[#D84C9F] px-4 py-1 text-white text-[10px] tracking-widest font-bold uppercase">
                  Most Popular
                </div>
              )}
              <h3 className="font-headline text-xl font-bold tracking-[-0.02em]">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1 text-[#1E1A5F]">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-[#64748B] text-xs font-mono uppercase">/mo</span>
              </div>
              <ul className="mt-8 flex flex-col gap-4 flex-grow">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px]">check</span>
                    <span className="text-sm font-medium">{f}</span>
                  </li>
                ))}
                {plan.missing?.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 opacity-60">
                    <span className="material-symbols-outlined text-[#64748B] text-[20px]">close</span>
                    <span className="text-sm text-[#64748B]">{m}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/plans" 
                className={`mt-8 w-full py-3 rounded-full font-bold transition-all text-center block ${
                  plan.featured 
                    ? 'bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white hover:brightness-105 shadow-sm' 
                    : 'border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1E1A5F]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center mt-12 text-xs font-mono uppercase tracking-wider text-[#64748B]">
          Note: Subscribers get discount top-ups for high-volume months.
        </p>
      </div>
    </section>
  )
}
