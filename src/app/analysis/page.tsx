'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function AnalysisPage() {
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = async () => {
    const emailText = `Dear GlowDrink Team,

Thank you for the opportunity to partner on the Summer Glow Campaign. I’ve reviewed the agreement and have proposed adjustments to better align with industry standards for creators of my reach.

Regarding Section 4.2 (Usage): I’d like to propose a standard 12-month paid usage window rather than a perpetual license. This allows for a fair renewal process if the brand wishes to continue using the content beyond the campaign cycle.

Regarding Section 7.1 (Exclusivity): The current definition of competitive products is quite broad. I suggest narrowing this to "Carbonated Functional Energy Drinks" and reducing the term to 6 months post-campaign.

Additionally, I would like to include a few standard protection clauses that were missing from the initial draft: specifically, a Late Payment Fee (5% per 30 days) to ensure timely compensation, and Mutual Termination Rights to protect both parties in unforeseen circumstances.

I’m excited about this collaboration and look forward to your thoughts.

Regards,
Alex Rivera & Team`

    try {
      await navigator.clipboard.writeText(emailText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      alert('Failed to copy. Please copy manually.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-on-surface">
      {/* Colorful blurred glassmorphism background (matching upload page) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]/60" />
        <div className="absolute -top-1/4 -left-1/4 w-[750px] h-[750px] rounded-full bg-primary/50 blur-[150px]" />
        <div className="absolute top-1/4 -right-1/3 w-[600px] h-[600px] rounded-full bg-secondary/45 blur-[130px]" />
        <div className="absolute -bottom-1/3 left-1/5 w-[550px] h-[550px] rounded-full bg-tertiary/40 blur-[140px]" />
        <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] rounded-full bg-primary/35 blur-[110px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-tertiary/30 blur-[120px]" />
      </div>

      <Navbar />

      <main className="max-w-[1280px] mx-auto px-6 md:px-10 py-8 space-y-8">
        {/* Audit Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-secondary font-medium">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="font-mono text-xs uppercase tracking-[2px]">Scan Complete</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">description</span>
              <h2 className="font-headline text-xl font-semibold tracking-tight text-on-surface">
                Summer_Glow_Campaign_Agreement.docx
              </h2>
              <span className="text-on-surface-variant text-sm">• Audited just now</span>
            </div>
          </div>

          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 hover:bg-white/5 transition text-sm">
            <span className="material-symbols-outlined text-base">download</span>
            Download PDF Audit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Critical Findings */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-error text-2xl">flag</span>
                <h3 className="font-headline text-xl font-semibold tracking-tight">Critical Findings (2 Red Flags)</h3>
              </div>

              {/* Flag 1 */}
              <div className="glass-panel rounded-2xl p-6 mb-6 border-l-4 border-error">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-error">FLAG 1: PERPETUAL USAGE RIGHTS</h4>
                  <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded">SECTION 4.2</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-on-surface-variant mb-1">Original Text</p>
                    <p className="text-on-surface-variant italic">
                      "...granting the Brand an <span className="text-error bg-error/10 px-1 rounded">exclusive, worldwide, perpetual, royalty-free license</span> to all Content..."
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border-l-4 border-primary">
                    <p className="flex items-center gap-2 text-sm text-primary mb-1">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                      AI Translation
                    </p>
                    <p>They want to use your video forever, including TV and billboards, without ever paying you again.</p>
                  </div>
                </div>
              </div>

              {/* Flag 2 */}
              <div className="glass-panel rounded-2xl p-6 border-l-4 border-error">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-error">FLAG 2: BROAD EXCLUSIVITY</h4>
                  <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded">SECTION 7.1</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-on-surface-variant mb-1">Original Text</p>
                    <p className="text-on-surface-variant italic">
                      "...cannot promote competitive beverage products... for a period of 24 months..."
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border-l-4 border-primary">
                    <p className="flex items-center gap-2 text-sm text-primary mb-1">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                      AI Translation
                    </p>
                    <p>This locks you out of nearly all beverage partnerships for two full years after the campaign.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Missing Protections */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary text-2xl">verified_user</span>
                <h3 className="font-headline text-xl font-semibold tracking-tight">Missing Protections</h3>
              </div>

              <div className="glass-panel rounded-2xl p-6">
                <p className="text-on-surface-variant mb-6">Your agreement is missing standard creator protections. Recommended additions:</p>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: 'payments', title: 'Late Payment Fees', desc: '5% penalty for payments more than 30 days overdue.' },
                    { icon: 'cancel', title: 'Mutual Termination Rights', desc: 'Exit if the brand undergoes a major PR crisis.' },
                    { icon: 'balance', title: 'Usage Rights Renewal', desc: 'Clear framework for extending content usage.' },
                    { icon: 'security_update_good', title: 'Indemnification Caps', desc: 'Limit your liability to the total campaign fee.' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">{item.icon}</span>
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-on-surface-variant mt-1">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Counter-Offer */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">chat_bubble</span>
                <h3 className="font-headline text-xl font-semibold tracking-tight">Generated Counter-Offer</h3>
              </div>

              <div className="glass-panel rounded-2xl p-8 space-y-6">
                <div className="prose prose-invert text-on-surface/90 max-w-none leading-relaxed">
                  <p>Dear GlowDrink Team,</p>
                  <p>Thank you for the opportunity to partner on the Summer Glow Campaign. I’ve reviewed the agreement and have proposed adjustments to better align with industry standards for creators of my reach.</p>
                  <p>Regarding <span className="font-semibold text-primary">Section 4.2 (Usage)</span>: I’d like to propose a standard 12-month paid usage window rather than a perpetual license.</p>
                  <p>Regarding <span className="font-semibold text-primary">Section 7.1 (Exclusivity)</span>: I suggest narrowing this to "Carbonated Functional Energy Drinks" and reducing the term to 6 months post-campaign.</p>
                  <p>I’m excited about this collaboration and look forward to your thoughts.</p>
                  <p>Regards,<br />Alex Rivera &amp; Team</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.985] transition"
                  >
                    {copied ? (
                      <>
                        <span className="material-symbols-outlined">check</span> COPIED!
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">content_copy</span> COPY EMAIL
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Health Score */}
            <div className="glass-panel rounded-2xl p-7 text-center">
              <h4 className="font-mono text-xs uppercase tracking-[2px] text-on-surface-variant mb-4">Deal Health Score</h4>

              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="42" fill="none" 
                    stroke="#FFCC00" 
                    strokeWidth="8" 
                    strokeDasharray="263.9" 
                    strokeDashoffset="100" 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-semibold tracking-tighter">62</span>
                  <span className="text-xs text-on-surface-variant">/ 100</span>
                </div>
              </div>

              <div className="text-sm bg-tertiary/10 text-tertiary px-4 py-3 rounded-xl">
                Moderate Risk — Several unfavorable clauses present.
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-4">Actions</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition text-left">
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">history</span>
                    View Scan History
                  </span>
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition text-left">
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">share</span>
                    Share with Manager
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer showCTA={false} />
    </div>
  )
}
