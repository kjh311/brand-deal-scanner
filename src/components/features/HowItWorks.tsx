'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle2, AlertTriangle, Mail, Copy } from 'lucide-react'

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [scoreVal, setScoreVal] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const [simulatedCopied, setSimulatedCopied] = useState(false)
  const [showCursor, setShowCursor] = useState(false)

  const emailText = `Subject: Re: Aether Threads Partnership - Excited to Collaborate!\nTo: Aether Threads Team\n\nDear Aether Threads Team,\n\nI am thrilled about the opportunity to partner with Aether Threads. I love the collection and am eager to get started. I have reviewed the agreement and have identified standard adjustments:\n\n1. Section 3.2: Payment Timeline. I request that the payment terms be adjusted to Net-30 from receipt of invoice, rather than 120 days. Proposed Language: Payment shall be issued within 30 days of receipt of a valid invoice.`

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText.replace("Subject: Re: Aether Threads Partnership - Excited to Collaborate!\nTo: Aether Threads Team\n\n", ""))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveStep(0)
          interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3)
          }, 6000) // Increase interval to 6s to allow full typewriting & score animations
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

  // Sync uploadKey to restart Step 0 animations on return
  useEffect(() => {
    if (activeStep === 0) {
      setUploadKey((prev) => prev + 1)
    }
  }, [activeStep])

  // Score count-up animation for Step 1
  useEffect(() => {
    if (activeStep === 1) {
      setScoreVal(0)
      let current = 0
      const target = 75
      const duration = 1200 // 1.2 seconds count up
      const intervalTime = 30
      const increment = target / (duration / intervalTime)

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setScoreVal(target)
          clearInterval(timer)
        } else {
          setScoreVal(Math.floor(current))
        }
      }, intervalTime)

      return () => clearInterval(timer)
    }
  }, [activeStep])

  // Typewriter animation for Step 2
  useEffect(() => {
    if (activeStep === 2) {
      setTypedText('')
      setSimulatedCopied(false)
      setShowCursor(false)
      let index = 0
      const charsPerStep = 6
      const timer = setInterval(() => {
        index += charsPerStep
        if (index >= emailText.length) {
          setTypedText(emailText)
          clearInterval(timer)
        } else {
          setTypedText(emailText.slice(0, index))
        }
      }, 25)

      // Start simulated cursor movement 0.6s after copy button appears (approx 2.4s into Step 2)
      const cursorTimer = setTimeout(() => {
        setShowCursor(true)
      }, 2400)

      // Simulate the click/copied trigger exactly 1.1s later (at 3.5s)
      const clickTimer = setTimeout(() => {
        setSimulatedCopied(true)
      }, 3500)

      return () => {
        clearInterval(timer)
        clearTimeout(cursorTimer)
        clearTimeout(clickTimer)
      }
    }
  }, [activeStep])

  return (
    <section ref={sectionRef} className="bg-white/5 border-y border-white/10 py-16 sm:py-20 px-5 sm:px-10" id="how-it-works">
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
              { num: 1, title: 'Risk Analysis', desc: 'Our AI scans for broad predatory terms—like hidden exclusivity traps, endless usage rights, and non-payment risks—while spotting critical missing protections and recommending exact clauses you should ask to include.' },
              { num: 2, title: 'Counter-Offer', desc: 'Get a tailored email response that negotiates your terms and fixes unfair contract clauses automatically.' }
            ].map((step) => {
              const isActive = activeStep === step.num
              return (
                <div 
                  key={step.num} 
                  onClick={() => setActiveStep(step.num)}
                  className={`flex gap-6 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isActive
                      ? 'bg-white/10 border-white/20 shadow-lg scale-[1.02]' 
                      : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center font-bold transition-all duration-300 ${isActive
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
            <div className={`absolute inset-0 p-6 sm:p-10 flex flex-col items-center justify-center transition-all duration-500 ${activeStep === 0 ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
            }`}>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1E1A5F] text-center mb-2">Contract Analysis & Risk Detection</h3>
              <p className="text-sm text-[#64748B] text-center mb-8 max-w-[420px]">
                Scan for hidden traps and unfavorable clauses with our AI-powered engine.
              </p>
              
              <div className="w-full max-w-[360px] aspect-[4/3] border-2 border-dashed border-[#D84C9F]/30 rounded-2xl bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                {/* Upload content wraps in a fade-out container once active */}
                <div key={`upload-content-${uploadKey}`} className="flex flex-col items-center justify-center w-full h-full animate-upload-content">
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
                </div>
                
                {/* Upload simulation overlay */}
                <div key={`overlay-${uploadKey}`} className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 transition-all duration-300 opacity-0 animate-analysis-step">
                  <div className="w-12 h-12 border-4 border-[#D84C9F] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-[#1E1A5F] animate-pulse">Analyzing Contract Clauses...</p>
                  <div className="w-full max-w-[200px] h-2 bg-[#E2E8F0] rounded-full overflow-hidden mt-4">
                    <div key={`progress-${uploadKey}`} className="h-full w-0 bg-gradient-to-r from-[#221A7F] to-[#D84C9F] rounded-full animate-progress-bar"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Analysis Results View */}
            <div className={`absolute inset-0 p-6 sm:p-10 flex flex-col justify-center transition-all duration-500 ${activeStep === 1 ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
            }`}>
              {/* Alert Banner */}
              <div className="w-full mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 animate-pulse" />
                <span className="text-sm font-bold text-red-700">This contract has predatory clauses</span>
              </div>

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
                      strokeDashoffset={251.2 - (251.2 * scoreVal) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-[0.1s] ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold text-[#1E1A5F]">{scoreVal}</span>
                    <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold">HEALTHY</span>
                  </div>
                </div>

                {/* Score Warnings List */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className={`flex items-center gap-3 transition-all duration-500 ${activeStep === 1 ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-2'
                  }`}>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#53e16f]" />
                    </div>
                    <div>
                      <h5 className="font-headline font-bold text-[#1E1A5F]">Standard Usage Rights</h5>
                      <p className="text-xs sm:text-sm text-[#64748B]">Usage limited to 12 months on social media channels.</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 transition-all duration-500 ${activeStep === 1 ? 'opacity-100 translate-y-0 delay-[800ms]' : 'opacity-0 translate-y-2'
                  }`}>
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-headline font-bold text-[#1E1A5F]">Broad Exclusivity Trap</h5>
                      <p className="text-xs sm:text-sm text-[#64748B]">Prohibits work with all "beverage" brands for 2 years.</p>
                    </div>
                  </div>

                  <div className={`mt-2 p-3 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all duration-500 ${activeStep === 1 ? 'opacity-100 translate-y-0 delay-[1400ms]' : 'opacity-0 translate-y-2'
                  }`}>
                    <p className="text-[11px] font-mono text-[#D84C9F] font-bold leading-normal">
                      AI Recommendation: Strike clause 4.2. Limit exclusivity to direct competitors only (e.g., Brand X, Brand Y).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Email Draft Output View */}
            <div className={`absolute inset-0 p-6 sm:p-10 flex flex-col justify-center transition-all duration-500 ${activeStep === 2 ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-4 shrink-0">
                <Mail className="w-5 h-5 text-[#D84C9F]" />
                <h4 className="font-bold text-lg text-[#1E1A5F]">Email Response Draft</h4>
              </div>
              
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 font-sans text-xs sm:text-sm text-[#334155] overflow-y-auto h-[220px] shadow-inner shrink-0">
                <pre className="font-sans whitespace-pre-wrap leading-relaxed select-none">
                  {typedText}
                  {activeStep === 2 && typedText.length < emailText.length && (
                    <span className="inline-block w-1.5 h-4 bg-[#D84C9F] ml-0.5 animate-pulse" />
                  )}
                </pre>
              </div>

              {/* Reserved height button container */}
              <div className="h-14 mt-4 w-full flex items-center justify-center shrink-0 relative">
                {activeStep === 2 && typedText.length >= emailText.length - 120 ? (
                  <>
                    <button
                      className={`w-full text-white font-bold py-2.5 px-6 rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 pointer-events-none animate-fade-in-quick ${
                        simulatedCopied ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {simulatedCopied ? 'Copied!' : 'Copy Email'}
                    </button>
                    {showCursor && (
                      <div className="absolute right-4 top-12 pointer-events-none z-50 animate-simulated-cursor">
                        <svg className="w-6 h-6 drop-shadow-lg text-black fill-white" viewBox="0 0 24 24" stroke="black" strokeWidth="1.5">
                          <path d="M4.5 3v15.3l4.7-4.7 3.5 8.1 3.5-1.5-3.5-8.1 6.3-.3L4.5 3z" />
                        </svg>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-10 w-full" />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      <style>{`
        @keyframes uploadContentFade {
          0%, 35% { opacity: 1; visibility: visible; }
          45%, 100% { opacity: 0; visibility: hidden; }
        }
        .animate-upload-content {
          animation: uploadContentFade 6s forwards ease-in-out;
        }
        @keyframes analysisOverlay {
          0% { opacity: 0; }
          40% { opacity: 0; }
          52% { opacity: 1; }
          100% { opacity: 1; }
        }
        .animate-analysis-step {
          animation: analysisOverlay 6s forwards ease-in-out;
        }
        @keyframes progressBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-bar {
          animation: progressBar 3.6s linear 2.4s forwards;
        }
        @keyframes fadeInQuick {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-quick {
          animation: fadeInQuick 0.25s forwards ease-out;
        }
        @keyframes simulatedCursorMove {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          /* Move to the button center */
          65% {
            transform: translate(-140px, -36px) scale(1);
            opacity: 1;
          }
          /* Click down */
          75% {
            transform: translate(-140px, -36px) scale(0.85);
            opacity: 1;
          }
          /* Release click and fade out */
          85% {
            transform: translate(-140px, -36px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-140px, -36px) scale(1);
            opacity: 0;
          }
        }
        .animate-simulated-cursor {
          animation: simulatedCursorMove 1.5s forwards cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>
    </section>
  )
}
