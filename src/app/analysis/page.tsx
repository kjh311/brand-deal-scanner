'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Loader2, AlertCircle, CheckCircle2, Flag, ShieldAlert, FileText, Copy, Check, Download, History, Share2 } from 'lucide-react'
import { ReportTemplate } from '@/components/analysis/ReportTemplate'

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
      
      // Handle page numbers via jsPDF hook
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
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Finalizing Report Surface...</p>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Audit Fragmented</h2>
        <p className="text-slate-400 max-w-sm text-sm">We couldn't reconstruct the analysis for this specific contract.</p>
        <a href="/upload" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">New Audit</a>
      </div>
    )
  }

  const scoreColor = contract.health_score > 70 ? 'stroke-[#3fb950]' : contract.health_score > 40 ? 'stroke-[#d29922]' : 'stroke-[#f85149]';
  const scoreText = contract.health_score > 70 ? 'Fair Agreement' : contract.health_score > 40 ? 'Moderate Risk' : 'High Risk';
  const scoreBadge = contract.health_score > 70 ? 'bg-[#3fb950]/10 text-[#3fb950] border-2 border-[#3fb950]/20' : contract.health_score > 40 ? 'bg-[#d29922]/10 text-[#d29922] border-2 border-[#d29922]/20' : 'bg-[#f85149]/10 text-[#f85149] border-2 border-[#f85149]/20';

  return (
    <main className="max-w-[1240px] mx-auto px-6 md:px-10 py-12 space-y-12 animate-in fade-in duration-500">
      
      {/* Refined Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Security Audit Active
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {(() => {
              const fileName = contract.file_path?.split('/').pop() || '';
              // If it has our UUID_ prefix, strip it (UUID is 36 chars)
              const displayName = fileName.includes('_') && fileName.indexOf('_') === 36
                ? fileName.substring(37)
                : fileName;
              return displayName.split('.')[0].replace(/_/g, ' ') || 'Untitled Report';
            })()}
          </h2>
          <p className="text-slate-500 text-xs font-semibold">Processed on {new Date(contract.created_at).toLocaleDateString()}</p>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-800 border-2 border-white/10 hover:border-blue-500/30 transition text-xs font-bold text-white shadow-xl cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Scan Results
        </button>
      </header>

      {/* Hidden Report Template for PDF Generation */}
      <ReportTemplate ref={reportRef} contract={contract} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-12">
          
          {/* Summary */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px]">Summary</h3>
            <div className="bg-[#21262d] rounded-3xl p-8 text-slate-300 leading-relaxed text-base border-2 border-blue-500/20 shadow-2xl">
              {contract.summary}
            </div>
          </section>

          {/* Red Flags */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px]">Critical Risks</h3>

            <div className="space-y-6">
              {contract.predatory_clauses?.map((clause: any, i: number) => (
                <div key={i} className="bg-[#21262d] border-2 border-rose-500/50 rounded-[2.5rem] overflow-hidden shadow-2xl transition hover:bg-[#252b34]">
                  <div className="p-8 space-y-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono opacity-60">Source Passage</p>
                      <div className="text-sm text-slate-400 font-mono leading-relaxed bg-[#0d1117] p-6 rounded-2xl border border-white/5 italic">
                        "{clause.snippet}"
                      </div>
                    </div>
                    <div className="bg-rose-500/5 rounded-2xl p-6 border border-rose-500/10">
                      <p className="text-rose-400 font-black text-[10px] uppercase tracking-widest mb-3">AI Verdict</p>
                      <p className="text-slate-100 text-lg leading-relaxed font-bold tracking-tight">{clause.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Areas of Concern */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px]">Areas of Concern</h3>

            <div className="grid grid-cols-1 gap-4">
              {contract.cautionary_clauses?.map((clause: any, i: number) => (
                <div key={i} className="bg-[#21262d] rounded-2xl p-6 border-2 border-amber-400/40 border-l-8 border-l-amber-500/40 shadow-xl">
                  <div className="space-y-4">
                     <p className="text-slate-500 italic text-xs font-mono leading-snug">"{clause.snippet}"</p>
                     <p className="text-slate-200 text-base leading-relaxed font-bold">{clause.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Missing Protections */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px]">Missing Safeguards</h3>

            <div className="bg-[#21262d] border-2 border-blue-500/20 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-8">
                {contract.missing_protections?.map((item: any, i: number) => (
                  <div key={i} className="bg-slate-800/40 rounded-2xl p-6 border border-white/5 flex flex-col gap-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-base text-slate-100 mb-1">{item.protection}</p>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.importance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Legal Translation */}
          <section className="space-y-6 text-blue-400">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px]">Legal Decoder</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {contract.legalese_translation?.map((term: any, i: number) => (
                 <div key={i} className="bg-[#21262d] rounded-2xl p-6 border-2 border-blue-500/10 hover:border-blue-500/30 transition-all shadow-xl">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Instance</p>
                        <p className="text-xs font-mono text-slate-500 leading-relaxed italic truncate">"{term.original}"</p>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-2">Meaning</p>
                        <p className="text-base font-bold text-slate-100 tracking-tight leading-tight uppercase font-mono">{term.translation}</p>
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          {/* Counter-Offer Section */}
          <section id="counter-offer" className="space-y-8 pt-10">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              <Copy className="w-5 h-5 text-blue-500" />
              Email Response Draft
            </h3>

            <div className="bg-[#21262d] rounded-[3rem] p-10 space-y-10 border-4 border-blue-500/30 shadow-2xl relative overflow-hidden group">              
              <div className="prose prose-invert text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-base font-medium relative z-10 selection:bg-blue-500/40">
                {contract.suggested_response}
              </div>

              <div className="flex justify-end pt-8">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-slate-100 text-slate-950 font-black shadow-2xl transition-all hover:scale-[1.03] active:scale-95 text-base"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied' : 'Copy Email Script'}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#21262d] rounded-[3rem] p-10 text-center sticky top-24 border-2 border-blue-500/20 shadow-2xl shadow-black/50">
            <h4 className="font-mono text-[10px] uppercase tracking-[6px] text-slate-500 mb-12 font-black">Contract Health</h4>

            <div className="relative w-60 h-60 mx-auto mb-12 group transition-transform duration-1000 active:scale-105">
              <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full" />
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="10" />
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
                <span className="text-8xl font-black tracking-tighter text-white leading-none drop-shadow-2xl">{displayScore}</span>
                <span className="text-[10px] font-mono text-slate-500 mt-5 tracking-[6px] uppercase font-black">Fairness</span>
              </div>
            </div>

            <div className={`text-[10px] font-black px-8 py-4 rounded-xl border-2 ${scoreBadge} tracking-[2px] uppercase shadow-lg`}>
              {scoreText}
            </div>

            <div className="mt-12 pt-12 border-t border-white/5 grid grid-cols-1 gap-4">
                 <button className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all font-black text-[10px] tracking-[2px] text-white">
                    <span className="flex items-center gap-3"><Share2 className="w-4 h-4 text-blue-400" /> SHARE</span>
                 </button>
                 <button onClick={() => window.location.href = '/upload'} className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/40 transition font-black text-[10px] tracking-[2px] text-slate-500 hover:text-slate-100 uppercase">
                    <span className="flex items-center gap-3"><History className="w-4 h-4" /> New Audit</span>
                 </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AnalysisPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e0e0e0] selection:bg-blue-600/50">
      <Navbar />
      <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 text-center">
        <Loader2 className="animate-spin text-blue-500 w-16 h-16" />
        <p className="text-white/20 text-xs font-black tracking-[20px] uppercase">Decrypting Analysis...</p>
      </div>}>
        <AnalysisContent />
      </Suspense>
      <Footer showCTA={false} />
    </div>
  )
}
