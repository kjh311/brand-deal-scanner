'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface Audit {
  id: number
  name: string
  date: string
  risk: 'Low' | 'Medium' | 'High'
  fileType: string
  archived?: boolean
}

const initialAudits: Audit[] = [
  { id: 1, name: "Summer_Glow_Campaign_Agreement.pdf", date: "Oct 26, 2023", risk: "Low", fileType: "pdf" },
  { id: 2, name: "Holiday_Rundown.docx", date: "Oct 26, 2023", risk: "Medium", fileType: "docx" },
  { id: 3, name: "Quick_Screenshot.png", date: "Oct 26, 2023", risk: "High", fileType: "image" },
  { id: 4, name: "Holiday_Rundown_v2.docx", date: "Oct 25, 2023", risk: "Medium", fileType: "docx" },
  { id: 5, name: "Contract_Archive_088.pdf", date: "Oct 20, 2023", risk: "Low", fileType: "pdf", archived: true },
]

export default function HistoryPage() {
  const [audits, setAudits] = useState<Audit[]>(initialAudits)
  const [filter, setFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All')

  const filteredAudits = filter === 'All' 
    ? audits 
    : audits.filter(a => a.risk === filter)

  const handleDelete = (id: number) => {
    if (confirm('Delete this audit?')) {
      setAudits(prev => prev.filter(a => a.id !== id))
    }
  }

  const handleLoadMore = () => {
    alert('In a real app this would load more records from Supabase.')
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'Low') return 'bg-secondary text-on-secondary'
    if (risk === 'Medium') return 'bg-tertiary text-on-tertiary'
    return 'bg-error text-white'
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-on-surface">
      {/* Colorful blurred background (consistent with upload/analysis) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]/60" />
        <div className="absolute -top-1/4 -left-1/4 w-[750px] h-[750px] rounded-full bg-primary/50 blur-[150px]" />
        <div className="absolute top-1/4 -right-1/3 w-[600px] h-[600px] rounded-full bg-secondary/45 blur-[130px]" />
        <div className="absolute -bottom-1/3 left-1/5 w-[550px] h-[550px] rounded-full bg-tertiary/40 blur-[140px]" />
        <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] rounded-full bg-primary/35 blur-[110px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-tertiary/30 blur-[120px]" />
      </div>

      <Navbar />

      <main className="pt-20 pb-12 px-6 md:px-10 max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
            <div>
              <h1 className="font-headline text-3xl font-semibold tracking-tight">Welcome, Creator!</h1>
              <p className="text-on-surface-variant mt-1">Review recent audits or start a scan.</p>
            </div>

            {/* Stats */}
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Total Scans (Last 30 Days)</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-semibold tracking-tighter">48</span>
                <span className="text-secondary flex items-center gap-1 text-sm">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Healthy
                </span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-error/20">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">High-Risk Contracts</p>
                  <span className="text-5xl font-semibold tracking-tighter text-error">9</span>
                </div>
                <span className="material-symbols-outlined text-error text-3xl">warning</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant mb-4">Top Flag Categories</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Perpetual Usage Rights</span><span className="text-on-surface-variant">6</span></div>
                <div className="flex justify-between"><span>Broad Exclusivity</span><span className="text-on-surface-variant">3</span></div>
                <div className="flex justify-between"><span>Uncapped Revisions</span><span className="text-on-surface-variant">1</span></div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">workspace_premium</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">PRO PLAN — ACTIVE</p>
                  <p className="text-xs text-on-surface-variant">Renews Nov 15, 2026</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Table */}
          <section className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-headline text-3xl font-semibold tracking-tight">Your Audit History</h2>
              <Link 
                href="/upload" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-semibold text-sm active:scale-[0.985] transition"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                Start New Audit
              </Link>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {(['All', 'Low', 'Medium', 'High'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={`px-4 py-1.5 rounded-full text-sm transition ${
                    filter === r 
                      ? 'bg-primary text-on-primary' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-on-surface-variant text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Document</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Risk</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAudits.length > 0 ? (
                      filteredAudits.map((audit) => (
                        <tr key={audit.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded flex items-center justify-center ${
                                audit.fileType === 'pdf' ? 'bg-error/20' : 
                                audit.fileType === 'image' ? 'bg-secondary/20' : 'bg-primary/20'
                              }`}>
                                <span className="material-symbols-outlined text-base">
                                  {audit.fileType === 'pdf' ? 'picture_as_pdf' : 
                                   audit.fileType === 'image' ? 'image' : 'description'}
                                </span>
                              </div>
                              <span className={audit.archived ? 'opacity-60' : ''}>
                                {audit.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">{audit.date}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getRiskColor(audit.risk)}`}>
                              {audit.risk} Risk
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!audit.archived ? (
                                <>
                                  <Link 
                                    href="/analysis" 
                                    className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 transition"
                                  >
                                    View Report
                                  </Link>
                                  <button className="p-2 hover:text-primary transition">
                                    <span className="material-symbols-outlined text-lg">download</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(audit.id)} 
                                    className="p-2 hover:text-error transition"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-on-surface-variant/50 text-xs">Archived</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                          No audits match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button 
                onClick={handleLoadMore}
                className="px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 text-sm transition"
              >
                Load 10 More Entries
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer showCTA={false} />
    </div>
  )
}
