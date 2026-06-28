'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function TrustSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from(".reveal-trust", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const features = [
    {
      icon: 'encrypted',
      title: 'Zero Data Storage',
      description: 'Your documents are processed in memory and immediately purged after the audit.'
    },
    {
      icon: 'psychology',
      title: 'No AI Training',
      description: 'We never use your sensitive deal data or contract clauses to train our models.'
    },
    {
      icon: 'do_not_disturb_on',
      title: 'No Third-Party Selling',
      description: 'Your business is yours. We monetize through subscriptions, not your personal data.'
    }
  ]

  return (
    <section ref={containerRef} className="bg-white/5 py-20 px-10 border-y border-white/10">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div key={idx} className="reveal-trust flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-[#E2E8F0] shadow-sm">
              <span className="material-symbols-outlined text-[32px] text-[#D84C9F]">{feature.icon}</span>
            </div>
            <h3 className="font-headline text-xl text-white font-bold tracking-[-0.02em]">
              {feature.title}
            </h3>
            <p className="text-sm text-white/70">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
