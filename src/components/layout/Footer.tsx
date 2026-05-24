'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function Footer() {
  const ctaRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    
    const elements = [ctaRef.current, footerRef.current]
    const ctx = gsap.context(() => {
      elements.forEach((el) => {
        if (!el) return
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true
          },
          opacity: 0,
          y: 50,
          duration: 1.2,
          ease: "power3.out"
        })
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* Final CTA */}
      <section ref={ctaRef} className="relative py-32 px-10 overflow-hidden" id="final-cta">
        <div className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="font-headline text-4xl text-on-surface leading-tight font-semibold tracking-[-0.02em]">
            Ready to Scan Your Next Deal?
          </h2>
          <p className="text-lg text-on-surface-variant mt-6 mb-10">
            Stop guessing. Protect your earnings and your rights with the industry's most advanced AI brand deal scanner.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="shimmer-btn px-10 py-5 rounded-full bg-secondary text-on-secondary font-bold text-lg hover:brightness-110 shadow-2xl">
              Start Your First Audit
            </button>
            <button className="px-10 py-5 rounded-full glass-card border-white/20 font-bold hover:bg-white/5 transition-colors">
              Watch Video Demo
            </button>
          </div>
        </div>
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.08)_0%,transparent_70%)]"></div>
        </div>
      </section>

      {/* Main Footer */}
      <footer ref={footerRef} className="w-full py-16 border-t border-outline-variant bg-black" id="main-footer">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-headline text-2xl font-bold text-on-surface">Brand Deal Scanner</div>
            <p className="text-sm text-on-surface-variant text-center md:text-left">
              © 2024 Brand Deal Scanner. Legal-Grade Security for Creators.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-xs font-mono uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-xs font-mono uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-xs font-mono uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors duration-200">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
