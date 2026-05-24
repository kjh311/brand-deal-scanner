'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const gaugeRef = useRef<SVGCircleElement>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const targetScore = 75
    
    const ctx = gsap.context(() => {
      // Step animations
      gsap.from(".reveal-step", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
        opacity: 0,
        x: -30,
        duration: 0.8,
        stagger: 0.3,
        ease: "power3.out"
      })

      // Gauge animation
      const obj = { val: 0 }
      gsap.to(obj, {
        scrollTrigger: {
          trigger: ".gauge-svg",
          start: "top 80%",
        },
        val: targetScore,
        duration: 2.5,
        ease: "power3.out",
        onUpdate: () => {
          const current = Math.floor(obj.val)
          setScore(current)
          if (gaugeRef.current) {
            const dashOffset = 251.2 - (251.2 * obj.val / 100)
            gaugeRef.current.setAttribute('stroke-dashoffset', dashOffset.toString())
            
            // Dynamic Color
            if (obj.val < 40) gaugeRef.current.setAttribute('stroke', '#ffb4ab')
            else if (obj.val < 70) gaugeRef.current.setAttribute('stroke', '#ffdad5')
            else gaugeRef.current.setAttribute('stroke', '#53e16f')
          }
        }
      })

      // Section reveal
      gsap.from(".animate-float", {
        scrollTrigger: {
          trigger: ".animate-float",
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 1.5,
        ease: "power3.out"
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 px-10" id="how-it-works">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-4">METHODOLOGY</p>
          <h2 className="font-headline text-4xl text-on-surface font-semibold tracking-[-0.02em]">
            Audit Process in 60 Seconds
          </h2>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 relative">
          <div className="flex flex-col gap-12">
            {[
              { num: '1', title: 'Upload Document', desc: 'Securely upload any PDF or DOCX agreement. Our OCR engine parses it instantly.' },
              { num: '2', title: 'Risk Analysis', desc: 'Our AI scans for exclusivity traps, usage rights, and non-payment risks.' },
              { num: '3', title: 'Counter-Offer', desc: 'Download a redlined PDF with optimized clauses for your protection.' }
            ].map((step) => (
              <div key={step.num} className="reveal-step flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-primary flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  {step.num}
                </div>
                <div>
                  <h4 className="font-headline text-xl text-on-surface font-medium tracking-[-0.02em]">{step.title}</h4>
                  <p className="text-sm text-on-surface-variant mt-2">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 glass-card rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 animate-float">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 gauge-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1C1C1E" strokeWidth="10" />
                <circle 
                  ref={gaugeRef}
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="#53e16f" 
                  strokeWidth="10" 
                  strokeDasharray="251.2" 
                  strokeDashoffset="251.2" 
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-bold text-on-surface">{score}</span>
                <span className="text-xs font-mono uppercase tracking-wider text-secondary">HEALTHY</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                </div>
                <div>
                  <h5 className="font-headline font-bold text-on-surface">Standard Usage Rights</h5>
                  <p className="text-sm text-on-surface-variant">Usage limited to 12 months on social media channels.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10 border border-error/20">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <div>
                  <h5 className="font-headline font-bold text-on-surface">Broad Exclusivity Trap</h5>
                  <p className="text-sm text-on-surface-variant">Prohibits work with all "beverage" brands for 2 years.</p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-surface-container-high border border-outline-variant/30">
                <p className="text-xs font-mono text-primary-container">
                  AI Recommendation: Strike clause 4.2. Limit exclusivity to direct competitors only (e.g., Brand X, Brand Y).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
