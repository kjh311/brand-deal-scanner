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
          start: "top 88%",
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
          start: "top 88%",
        },
        val: targetScore,
        duration: 2,
        ease: "none",
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
          start: "top 88%",
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
          <p className="text-xs font-mono uppercase tracking-wider text-white/80 mb-4">METHODOLOGY</p>
          <h2 className="font-headline text-4xl text-white font-bold tracking-[-0.02em]">
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
                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-[#D84C9F] flex items-center justify-center text-[#D84C9F] font-bold group-hover:bg-[#D84C9F] group-hover:text-white transition-colors">
                  {step.num}
                </div>
                <div>
                  <h4 className="font-headline text-xl text-white font-medium tracking-[-0.02em]">{step.title}</h4>
                  <p className="text-sm text-white/70 mt-2">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 animate-float text-[#1E1A5F]">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 gauge-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                <circle
                  ref={gaugeRef}
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#53e16f"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="251.2"
                  strokeLinecap="round"
                  className=""
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-bold text-[#1E1A5F]">{score}</span>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-500">HEALTHY</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                </div>
                <div>
                  <h5 className="font-headline font-bold text-[#1E1A5F]">Standard Usage Rights</h5>
                  <p className="text-sm text-[#64748B]">Usage limited to 12 months on social media channels.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                  <span className="material-symbols-outlined text-red-500">warning</span>
                </div>
                <div>
                  <h5 className="font-headline font-bold text-[#1E1A5F]">Broad Exclusivity Trap</h5>
                  <p className="text-sm text-[#64748B]">Prohibits work with all "beverage" brands for 2 years.</p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-xs font-mono text-[#D84C9F] font-bold">
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
