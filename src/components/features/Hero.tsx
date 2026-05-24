'use client'

import { useEffect, useRef } from 'react'
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
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-headline text-5xl text-on-surface leading-tight stagger-in font-bold tracking-[-0.02em]">
            Protect Your Brand. <br/>
            <span className="text-primary">Scan Your Deals</span> in Seconds.
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl stagger-in">
            Upload your brand contract, get an AI-powered risk audit, and generate a professional counter-offer instantly. No legal training required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center stagger-in">
            <button className="shimmer-btn w-full sm:w-auto px-8 py-4 rounded-full bg-secondary text-on-secondary font-bold text-lg hover:brightness-110 transition-all active:scale-95 shadow-[0_0_20px_rgba(83,225,111,0.3)]">
              Try Your Free Scan
            </button>
            <div className="animate-pulse-subtle flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[20px] fill-current">shield</span>
              <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Privacy First</span>
            </div>
          </div>
        </div>
        
        <div className="relative mt-12 lg:mt-0 stagger-in">
          <div className="glass-card rounded-xl p-8 relative z-10">
            <div className="border-2 border-dashed border-outline-variant rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-primary transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant group-hover:text-primary transition-colors">upload_file</span>
              <p className="text-xl mt-4 text-on-surface font-headline font-medium">Drop your contract here</p>
              <p className="text-sm text-on-surface-variant mt-2 text-center">PDF, DOCX, or scan (max 25MB)</p>
              <button className="mt-6 px-6 py-2 border border-outline rounded-full text-xs font-mono uppercase tracking-wider hover:bg-surface-variant transition-colors">
                Browse Files
              </button>
            </div>
            <div className="mt-8 flex justify-between items-center px-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-surface overflow-hidden ${
                    i === 1 ? 'bg-primary-container' : i === 2 ? 'bg-secondary-container' : 'bg-tertiary-container'
                  }`}></div>
                ))}
              </div>
              <p className="text-sm text-on-surface-variant">Trusted by 2,000+ Creators</p>
            </div>
          </div>
          
          {/* Background Decoration */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/10 blur-[80px] rounded-full"></div>
        </div>
      </div>
    </section>
  )
}
