'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".stagger-in", {
        opacity: 0,
        y: 40,
        duration: 1.2,
        stagger: 0.25,
        ease: "power4.out",
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative pt-28 sm:pt-32 pb-36 sm:pb-44 px-5 sm:px-10 overflow-hidden bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F]" id="hero">
      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-white leading-tight stagger-in font-bold tracking-[-0.02em]">
            Don't Sign Away Your Rights. <br />
            <span className="text-[#FFD166]">Scan Your Deals</span> in Seconds.
          </h1>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto mt-4 stagger-in">
            Spot the trap clauses, and flip the script with a professional counter-offer. Protect your brand—and pocket what you're actually worth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center items-center stagger-in">
            <Link href="/plans" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[#221A7F] font-bold text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-md cursor-pointer">
              Get Started
            </Link>
            <div className="animate-pulse-subtle flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
              <span className="material-symbols-outlined text-cyan-300 text-[20px] fill-current">shield</span>
              <span className="text-xs font-mono uppercase tracking-wider text-white/80">Privacy First</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curved Wave Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 translate-y-[1px]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-current text-transparent">
          <path d="M0,0 C300,90 900,10 1200,90 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  )
}
