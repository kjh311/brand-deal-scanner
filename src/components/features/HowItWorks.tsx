'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle2, AlertTriangle, Mail } from 'lucide-react'

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Restart animation on scroll into view
          setActiveStep(0)
          interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3)
          }, 5500) // 5.5 seconds per step to allow typing / progression to feel natural
        } else {
          clearInterval(interval)
        }
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 px-5 sm:px-10" id="how-it-works">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs font-mono uppercase tracking-wider text-white/80 mb-4">METHODOLOGY</p>
          <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em]">
            Audit Process in 60 Seconds
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Steps Description Column */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {[
              { num: 0, title: 'Upload Document', desc: 'Securely upload any PDF, DOCX, or TXT agreement.' },
              { num: 1, title: 'Risk Analysis', desc: 'Our AI scans for exclusivity traps, usage rights, and non-payment risks.' },
              { num: 2, title: 'Counter-Offer', desc: 'Get a tailored email response that negotiates your terms and fixes unfair contract clauses automatically.' }
            ].map((step) => {
              const isActive = activeStep === step.num
              return (
                <div 
                  key={step.num} 
                  onClick={() => setActiveStep(step.num)}
                  className={`flex gap-6 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-white/10 border-white/20 shadow-lg scale-[1.02]' 
                      : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#D84C9F] border-[#D84C9F] text-white' 
                      : 'border-white/40 text-white'
                  }`}>
                    {step.num + 1}
                  </div>
                  <div>
                    <h4 className="font-headline text-xl text-white font-medium tracking-[-0.02em]">{step.title}</h4>
                    <p className="text-sm text-white/70 mt-2">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Mockup Preview Box */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] shadow-2xl rounded-3xl min-h-[460px] flex flex-col overflow-hidden text-[#1E1A5F] transition-all duration-500 relative">
            
            {/* Step 0: Upload View */}
            <div className={`absolute inset-0 p-6 sm:p-10 flex flex-col items-center justify-center transition-all duration-500 ${
              activeStep === 0 ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
            }`}>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1E1A5F] text-center mb-2">Contract Analysis & Risk Detection</h3>
              <p className="text-sm text-[#64748B] text-center mb-8 max-w-[420px]">
                Scan for hidden traps and unfavorable clauses with our AI-powered engine.
              </p>
              
              <div className="w-full max-w-[360px] aspect-[4/3] border-2 border-dashed border-[#D84C9F]/30 rounded-2xl bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#221A7F] to-[#D84C9F] flex items-center justify-center text-white mb-4 animate-bounce">
                  <Upload className="w-6 h-6" />
                </div>
                
                <button className="bg-gradient-to-r from-[#221A7F] to-[#D84C9F] text-white font-bold py-2.5 px-6 rounded-full shadow-lg text-sm mb-3">
                  Add Document
                </button>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-4">
                  Drag & drop or click to upload
                </p>
                <div className="text-[10px] font-bold bg-[#E2E8F0]/60 px-3 py-1 rounded-full text-[#64748B]">
                  PDF, DOCX, OR TXT FILES
                </div>
                
                {/* Upload simulation overlay */}
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 transition-all duration-300 opacity-0 animate-analysis-step">
                  <div className="w-12 h-12 border-4 border-[#D84C9F] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-[#1E1A5F] animate-pulse">Analyzing Contract Clauses...</p>
                </div>
              </div>
            </div>

            {/* Step 1: Analysis Results View */}
            <div className={`absolute inset-0 p-6 sm:p-10 flex flex-col justify-center transition-all duration-500 ${
              activeStep === 1 ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
            }`}>
              <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                {/* Score Circle */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#53e16f"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * 75) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-[2s] ease-out delay-300"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold text-[#1E1A5F]">75</span>
                    <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold">HEALTHY</span>
                  </div>
                </div>

                {/* Score Warnings List */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#53e16f]" />
                    </div>
                    <div>
                      <h5 className="font-headline font-bold text-[#1E1A5F]">Standard Usage Rights</h5>
                      <p className="text-xs sm:text-sm text-[#64748B]">Usage limited to 12 months on social media channels.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-headline font-bold text-[#1E1A5F]">Broad Exclusivity Trap</h5>
                      <p className="text-xs sm:text-sm text-[#64748B]">Prohibits work with all "beverage" brands for 2 years.</p>
                    </div>
                  </div>

                  <div className="mt-2 p-3 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[11px] font-mono text-[#D84C9F] font-bold leading-normal">
                      AI Recommendation: Strike clause 4.2. Limit exclusivity to direct competitors only (e.g., Brand X, Brand Y).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Email Draft Output View */}
            <div className={`absolute inset-0 p-6 sm:p-10 flex flex-col justify-center transition-all duration-500 ${
              activeStep === 2 ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-4 shrink-0">
                <Mail className="w-5 h-5 text-[#D84C9F]" />
                <h4 className="font-bold text-lg text-[#1E1A5F]">Email Response Draft</h4>
              </div>
              
              <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 font-sans text-xs sm:text-sm text-[#334155] overflow-y-auto max-h-[300px] shadow-inner">
                <div className="font-semibold text-[#1E1A5F] mb-1">Subject: Re: Crimson Pickle Snacks Partnership - Excited to Collaborate!</div>
                <div className="text-[10px] sm:text-xs text-[#64748B] mb-3">To: Crimson Pickle Team</div>
                <div className="space-y-3 leading-relaxed">
                  <p>Dear Crimson Pickle Team,</p>
                  <p>I am thrilled about the opportunity to partner with Crimson Pickle Snacks. I love the product and am eager to get started on the campaign. I have reviewed the agreement and have identified a few standard industry adjustments to ensure a mutually beneficial partnership...</p>
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-[11px] font-mono text-amber-800 leading-normal">
                    <strong>1. Section 3.2: Payment Timeline.</strong> I request that the payment terms be adjusted to Net-30 from receipt of invoice, rather than 120 days post-campaign. This ensures my production costs are covered in a timely fashion. &rarr; <em>Proposed Language: Payment shall be issued within 30 days of receipt of a valid invoice following the completion of campaign deliverables.</em>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <style>{`
        @keyframes analysisOverlay {
          0%, 65% { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
        .animate-analysis-step {
          animation: analysisOverlay 5.5s infinite ease-in-out;
        }
      `}</style>
    </section>
  )
}
  )
}
