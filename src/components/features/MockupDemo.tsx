'use client'

import { useEffect, useState } from 'react'

export function MockupDemo() {
  const [visibleLines, setVisibleLines] = useState(0)
  const emailLines = [
    'Subject: Re: Brand Partnership Proposal',
    '',
    'Dear Brand Team,',
    '',
    'Thank you for the opportunity to collaborate.',
    'I have reviewed the proposed contract and would like',
    'to suggest a few standard adjustments:',
    '',
    '1. Payment Terms: A 120-day payout timeline is',
    '   inconsistent with standard practice. I request',
    '   Net-30 payment upon completion.',
    '',
    '2. Exclusivity: An 18-month post-campaign window',
    '   is above market standard. I propose 30 days.',
    '',
    '3. Indemnification: I request mutual indemnification',
    '   for a balanced partnership.',
    '',
    'I am eager to begin this collaboration.',
    '',
    'Best regards,',
    'The Creator',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= emailLines.length) return 0
        return prev + 1
      })
    }, 800)
    return () => clearInterval(interval)
  }, [emailLines.length])

  return (
    <div className="w-full max-w-5xl mx-auto mb-16">
      <div className="text-center mb-12">
        <p className="text-xs font-mono uppercase tracking-wider text-white/80 mb-4">Audit Process</p>
        <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em]">
          How It Works
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
        {/* Left Panel - Contract PDF Mockup */}
        <div className="flex-1 bg-[#1a1a3e]/90 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded-md border border-white/10">
              PDF Mockup
            </span>
          </div>

          {/* PDF Header Bar */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
            <span className="ml-3 text-xs font-mono text-white/40">contract_agreement.pdf</span>
          </div>

          {/* PDF Content Area */}
          <div className="space-y-3 relative min-h-[300px]">
            {/* Simulated PDF text lines */}
            <div className="h-3 bg-white/5 rounded-sm w-full" />
            <div className="h-3 bg-white/5 rounded-sm w-3/4" />
            <div className="h-3 bg-white/5 rounded-sm w-5/6" />
            <div className="h-3 bg-white/5 rounded-sm w-2/3" />

            {/* Warning Block - Highlighted Red */}
            <div className="relative bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-lg">warning</span>
                <span className="text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
                  BROAD EXCLUSIVITY TRAP
                </span>
              </div>
              <p className="text-red-300/70 text-xs mt-2 font-mono leading-relaxed">
                &quot;Exclusivity clause restricts creator from working with any competing brand for 18 months post-campaign.&quot;
              </p>
            </div>

            {/* More simulated PDF text */}
            <div className="h-3 bg-white/5 rounded-sm w-4/5 mt-3" />
            <div className="h-3 bg-white/5 rounded-sm w-full" />
            <div className="h-3 bg-white/5 rounded-sm w-3/4" />
            <div className="h-3 bg-white/5 rounded-sm w-5/6" />
            <div className="h-3 bg-white/5 rounded-sm w-1/2" />
          </div>

          {/* Scanning Laser Bar */}
          <div
            className="absolute left-0 right-0 h-[2px] bg-emerald-400/80 shadow-[0_0_12px_4px_rgba(52,211,153,0.4)] pointer-events-none"
            style={{
              animation: 'scanline 3s ease-in-out infinite',
              top: '15%',
            }}
          />
          <style>{`
            @keyframes scanline {
              0%, 100% { top: 10%; opacity: 0.3; }
              50% { top: 85%; opacity: 0.9; }
            }
          `}</style>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center justify-center self-center w-12 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#D84C9F]/20 border border-[#D84C9F]/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#D84C9F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Right Panel - Email Compose Mockup */}
        <div className="flex-1 bg-[#1a1a3e]/90 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded-md border border-white/10">
              Email Mockup
            </span>
          </div>

          {/* Email Header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-mono text-white/40">New Message</span>
          </div>

          {/* Green Highlight Block */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-sm">auto_awesome</span>
              <span className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                COUNTER-OFFER GENERATED
              </span>
            </div>
          </div>

          {/* Email Body - Placeholder Text Fading In */}
          <div className="space-y-1 min-h-[200px]">
            {emailLines.slice(0, visibleLines).map((line, i) => (
              <p
                key={i}
                className="text-xs font-mono text-white/60 leading-relaxed"
                style={{
                  animation: `fadeIn 0.4s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              >
                {line}
              </p>
            ))}
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>

      {/* Mobile: Stack vertically with a simple connector */}
      <div className="lg:hidden flex justify-center mt-6">
        <div className="w-1 h-8 bg-gradient-to-b from-[#D84C9F] to-transparent rounded-full" />
      </div>
    </div>
  )
}