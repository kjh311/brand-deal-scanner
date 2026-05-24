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
    <section ref={containerRef} className="relative pt-24 pb-32 px-10 overflow-hidden" id="hero">
      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-headline text-5xl text-on-surface leading-tight stagger-in font-bold tracking-[-0.02em]">
            Protect Your Brand. <br />
            <span className="text-primary">Scan Your Deals</span> in Seconds.
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mt-4 stagger-in">
            Upload your brand contract, get an AI-powered risk audit, generate a professional counter-offer instantly and close deals with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center items-center stagger-in">
            <Link href="/plans" className="shimmer-btn w-full sm:w-auto px-8 py-4 rounded-full bg-secondary text-on-secondary font-bold text-lg hover:brightness-110 transition-all active:scale-95 shadow-[0_0_20px_rgba(83,225,111,0.3)] cursor-pointer">
              Get Started
            </Link>
            <div className="animate-pulse-subtle flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[20px] fill-current">shield</span>
              <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
