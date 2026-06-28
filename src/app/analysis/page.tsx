'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Loader2, AlertCircle, CheckCircle2, Copy, Check, Download } from 'lucide-react'
import { ReportTemplate } from '@/components/analysis/ReportTemplate'
import { FeedbackSection } from '@/components/features/FeedbackSection'

function AnalysisContent() {
  const searchParams = useSearchParams()
  const contractId = searchParams.get('id')
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [ringOffset, setRingOffset] = useState(263.9)
  const reportRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchContract() {
      if (!contractId) return
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', contractId)
          .single()

        if (error) throw error
        setContract(data)
        animateNumbers(data.health_score || 0)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [contractId])

  const animateNumbers = (target: number) => {
    setTimeout(() => {
      setRingOffset(263.9 - (263.9 * target) / 100)
    }, 100)

    let start = 0
    const duration = 1000
    const increment = target / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setDisplayScore(target)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(start))
      }
    }, 16)
  }

  const handleCopy = async () => {
    if (!contract?.suggested_response) return
    try {
      await navigator.clipboard.writeText(contract.suggested_response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed')
    }
  }

  const handleExport = async () => {
    if (!reportRef.current || !contract) return
    
    try {
      const html2pdf = (await import('html2pdf.js')).default
      
      const rawName = contract.file_path?.split('/').pop() || '';
      const docName = rawName.includes('_') && rawName.indexOf('_') === 36
        ? rawName.substring(37).split('.')[0]
        : rawName.split('.')[0] || 'contract';

      const opt = {
        margin: 0,
        filename: `${docName}_scan_results.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as const
      
      const worker = html2pdf().from(reportRef.current).set(opt);
      
      worker.toPdf().get('pdf').then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);
        }
        pdf.save(`${docName}_scan_results.pdf`);
      });

    } catch (err) {
      console.error('PDF Export failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#D84C9F] animate-spin" />
        <p className="text-slate-200 font-bold tracking-widest text-[10px] uppercase">Finalizing Report Surface...</p>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <AlertCircle className="w-12 h-12 text-white/60" />
        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Audit Fragmented</h2>
        <p className="text-slate-300 max-w-sm text-sm">We couldn't reconstruct the analysis for this specific contract.</p>
        <a href="/upload" className="px-6 py-2 bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white rounded-lg font-bold text-sm shadow-md">New Audit</a>
      </div>
    )
  }

  const scoreColor = contract.health_score > 70 ? 'stroke-[#3fb950]' : contract.health_score > 40 ? 'stroke-[#d29922]' : 'stroke-[#f85149]';
  const scoreText = contract.health_score > 70 ? 'Fair Agreement' : contract.health_score > 40 ? 'Moderate Risk' : 'High Risk';
  const scoreBadge = contract.health_score > 70 ? 'bg-[#3fb950]/10 text-[#3fb950] border-2 border-[#3fb950]/20' : contract.health_score > 40 ? 'bg-[#d29922]/10 text-[#d29922] border-2 border-[#d29922]/20' : 'bg-[#f85149]/10 text-[#f85149] border-2 border-[#f85149]/20';

  return (
    <main className="max-w-[1000px] mx-auto px-6 md:px-10 py-12 space-y-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-[10px] uppercase tracking-widest opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
            Security Audit Active
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {(() => {
              const fileName = contract.file_path?.split('/').pop() || '';
              const displayName = fileName.includes('_') && fileName.indexOf('_') === 36
                ? fileName.substring(37)
                : fileName;
              return displayName.split('.')[0].replace(/_/g, ' ') || 'Untitled Report';
            })()}
          </h2>
          <p className="text-slate-300 text-xs font-semibold">Processed on {new Date(contract.created_at).toLocaleDateString()}</p>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/15 border border-white/20 hover:bg-white/25 transition text-xs font-bold text-white shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Scan Results
        </button>
      </header>

      {/* Hidden Report Template for PDF Generation */}
      <ReportTemplate ref={reportRef} contract={contract} />

      <div className="space-y-12">
        {/* Summary with Integrated Health Score */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-white/60 uppercase tracking-[4px]">Executive Summary</h3>
          <div className="bg-white rounded-[3rem] p-10 text-[#1E1A5F] leading-relaxed text-base border border-[#E2E8F0] shadow-xl">
            
            <div className="flex flex-col items-center mb-10 pb-10 border-b border-[#E2E8F0] relative overflow-hidden">
               <div className="absolute top-0 right-0">
                  <div className={`text-[9px] font-black px-4 py-2 rounded-xl border-2 ${scoreBadge} tracking-[2px] uppercase shadow-md`}>
                    {scoreText}
                  </div>
                </div>

                <div className="relative w-40 h-40 group transition-transform duration-1000">
                  <div className="absolute inset-0 bg-[#2E1E96]/5 blur-[60px] rounded-full" />
                  <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                    <circle 
                      cx="50" cy="50" r="42" fill="none" 
                      className={scoreColor}
                      strokeWidth="10" 
                      strokeDasharray="263.9" 
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-6xl font-black tracking-tighter text-[#1E1A5F] leading-none">{displayScore}</span>
                    <span className="text-[8px] font-mono text-[#64748B] mt-3 tracking-[3px] uppercase font-black">Score</span>
                  </div>
                </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed text-[#1E1A5F]">
                {contract.summary}
              </p>
            </div>
          </div>
        </section>

        {/* Red Flags */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-white/60 uppercase tracking-[4px]">Critical Risks</h3>
          <div className="space-y-6">
            {contract.predatory_clauses?.map((clause: any, i: number) => (
              <div key={i} className="bg-white border border-[#E2E8F0] border-l-8 border-l-rose-500 rounded-[2.5rem] overflow-hidden shadow-lg transition hover:shadow-xl">
                <div className="p-8 space-y-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest font-mono">Source Passage</p>
                    <div className="text-sm text-[#1E1A5F] font-mono leading-relaxed bg-[#FFF5F5] p-6 rounded-2xl border border-rose-100 italic">
                      "{clause.snippet}"
                    </div>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                    <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest mb-3">AI Verdict</p>
                    <p className="text-rose-700 text-lg leading-relaxed font-bold tracking-tight">{clause.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Areas of Concern */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-white/60 uppercase tracking-[4px]">Areas of Concern</h3>
          <div className="grid grid-cols-1 gap-4">
            {contract.cautionary_clauses?.map((clause: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] border-l-8 border-l-amber-500 shadow-md">
                <div className="space-y-4">
                   <p className="text-[#64748B] italic text-xs font-mono leading-snug">"{clause.snippet}"</p>
                   <p className="text-[#1E1A5F] text-base leading-relaxed font-bold">{clause.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Missing Protections */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-white/60 uppercase tracking-[4px]">Missing Safeguards</h3>
          <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8">
              {contract.missing_protections?.map((item: any, i: number) => (
                <div key={i} className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] flex flex-col gap-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#1E1A5F] mb-1">{item.protection}</p>
                    <p className="text-sm text-[#64748B] leading-relaxed font-medium">{item.importance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Legal Translation */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-white/60 uppercase tracking-[4px]">Legal Decoder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {contract.legalese_translation?.map((term: any, i: number) => (
               <div key={i} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#D84C9F]/30 transition-all shadow-md">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-[#64748B] uppercase mb-1">Instance</p>
                      <p className="text-xs font-mono text-[#64748B] leading-relaxed italic truncate">"{term.original}"</p>
                    </div>
                    <div className="pt-4 border-t border-[#E2E8F0]">
                      <p className="text-[9px] font-black text-[#D84C9F] uppercase mb-2">Meaning</p>
                      <p className="text-base font-bold text-[#1E1A5F] tracking-tight leading-tight uppercase font-mono">{term.translation}</p>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* Counter-Offer Section */}
        <section id="counter-offer" className="space-y-8 pt-10">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-cyan-300" />
            <h3 className="text-xl font-bold tracking-tight text-white">Email Response Draft</h3>
          </div>

          <div className="bg-white rounded-[3rem] p-10 space-y-10 border border-[#E2E8F0] shadow-xl relative overflow-hidden group">              
            <div className="prose text-[#1E1A5F] leading-relaxed whitespace-pre-wrap font-sans text-base font-medium relative z-10">
              {contract.suggested_response}
            </div>

            <div className="flex justify-end pt-8">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-bold shadow-md transition-all hover:scale-[1.03] active:scale-95 text-base cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied' : 'Copy Email Script'}
              </button>
            </div>
          </div>
        </section>

        <FeedbackSection contractId={contractId} />
      </div>
    </main>
  )
}

export default function AnalysisPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white selection:bg-white/20">
      <Navbar />
      <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 text-center">
        <Loader2 className="animate-spin text-[#D84C9F] w-16 h-16" />
        <p className="text-white/20 text-xs font-black tracking-[20px] uppercase">Decrypting Analysis...</p>
      </div>}>
        <AnalysisContent />
      </Suspense>
      <Footer  />
    </div>
  )
}
