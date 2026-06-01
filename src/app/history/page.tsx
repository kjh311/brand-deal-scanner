'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

interface Audit {
  id: string
  name: string
  date: string
  score: number | null
  status: string
  risk: 'Low' | 'Medium' | 'High' | 'Analyzing' | 'Failed'
  fileType: string
}

export default function HistoryPage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All')
  const [userName, setUserName] = useState<string>('Creator')
  const [stats, setStats] = useState({ total: 0, healthy: 0, risk: 0 })

  const supabase = useMemo(() => createClient(), [])

  const fetchAudits = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Personalized Welcome
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Creator'
      setUserName(name)

      // Fetch Contracts
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const mapped: Audit[] = data.map(c => {
          const score = c.health_score;
          let risk: Audit['risk'] = 'Analyzing';
          
          if (c.status === 'completed') {
            if (score >= 70) risk = 'Low';
            else if (score >= 40) risk = 'Medium';
            else risk = 'High';
          } else if (c.status === 'failed') {
            risk = 'Failed';
          }

          const rawName = c.file_path ? c.file_path.split('/').pop() : 'Direct Paste';
          // Strip UUID prefix (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx_)
          const fileName = rawName?.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/, '');
          const ext = fileName?.split('.').pop()?.toLowerCase() || 'text';

          return {
            id: c.id,
            name: fileName || 'Untitled Contract',
            date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            score: score,
            status: c.status,
            risk: risk,
            fileType: ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : (ext === 'jpg' || ext === 'png') ? 'image' : 'text'
          }
        })

        setAudits(mapped)
        
        // Calculate Stats
        const healthy = mapped.filter(a => a.risk === 'Low').length
        const highRisk = mapped.filter(a => a.risk === 'High').length
        setStats({ total: mapped.length, healthy, risk: highRisk })
      }
    } catch (err) {
      console.error('History fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAudits()
  }, [])

  const filteredAudits = filter === 'All' 
    ? audits 
    : audits.filter(a => a.risk === filter)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this audit record?')) return

    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id)
      if (error) throw error
      setAudits(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert('Failed to delete audit.')
      console.error(err)
    }
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'Low') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    if (risk === 'Medium') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    if (risk === 'High') return 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    if (risk === 'Analyzing') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
    return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-200">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]/60" />
        <div className="absolute -top-1/4 -left-1/4 w-[750px] h-[750px] rounded-full bg-primary/50 blur-[150px]" />
        <div className="absolute top-1/4 -right-1/3 w-[600px] h-[600px] rounded-full bg-secondary/45 blur-[130px]" />
        <div className="absolute -bottom-1/3 left-1/5 w-[550px] h-[550px] rounded-full bg-tertiary/40 blur-[140px]" />
      </div>

      <Navbar />

      <main className="pt-24 pb-12 px-6 md:px-10 max-w-[1280px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Stats */}
          <aside className="w-full lg:w-80 flex flex-col gap-8 shrink-0">
            <div>
              <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-2">History</h1>
              <p className="text-slate-500">Welcome back, {userName}.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mb-4">Total Audits</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-white">{stats.total}</span>
                  <span className="text-emerald-400 text-xs font-bold">Scanned</span>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-rose-500/20 bg-rose-500/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[3px] text-rose-500/60 mb-4">Critical Risks</p>
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black tracking-tighter text-rose-500">{stats.risk}</span>
                  <span className="material-symbols-outlined text-rose-500 text-3xl opacity-50">warning</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-8 border border-white/5 bg-white/[0.02] space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Need a new audit?</p>
                    <p className="text-xs text-slate-500">Upload and scan in seconds.</p>
                  </div>
               </div>
               <Link href="/upload" className="block w-full text-center py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:scale-[1.02] transition-transform">
                 Scan New Contract
               </Link>
            </div>
          </aside>

          {/* Table Content */}
          <section className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
               <div className="flex gap-2">
                {(['All', 'Low', 'Medium', 'High'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setFilter(r)}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all
                      ${filter === r 
                        ? 'bg-white text-slate-950 shadow-xl' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] border border-white/10 bg-black/20 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-500 text-[10px] uppercase font-black tracking-[3px] border-b border-white/5">
                      <th className="px-8 py-6">Agreement</th>
                      <th className="px-8 py-6">Analyzed</th>
                      <th className="px-8 py-6">Fairness Score</th>
                      <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Retrieving Vault Data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAudits.length > 0 ? (
                      filteredAudits.map((audit) => (
                        <tr 
                          key={audit.id} 
                          onClick={() => {
                            if (audit.status === 'completed') {
                              window.location.href = `/analysis?id=${audit.id}`;
                            }
                          }}
                          className={`group hover:bg-white/[0.04] transition-colors cursor-pointer ${audit.status !== 'completed' ? 'pointer-events-none opacity-60' : ''}`}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 group-hover:border-primary/30 transition-colors`}>
                                <span className="material-symbols-outlined text-xl">
                                  {audit.fileType === 'pdf' ? 'picture_as_pdf' : 
                                   audit.fileType === 'image' ? 'image' : 'description'}
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm line-clamp-1">{audit.name}</p>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none mt-1">Source: {audit.fileType}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <p className="text-sm font-medium text-slate-400">{audit.date}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase ${getRiskColor(audit.risk)}`}>
                              {audit.risk === 'Analyzing' ? 'Scanning...' : `${audit.risk} RISK`}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {audit.status === 'completed' && (
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white text-slate-400 group-hover:text-slate-950 transition-all shadow-lg">
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </div>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(audit.id);
                                }} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all cursor-pointer relative z-10"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                           <div className="max-w-xs mx-auto space-y-4">
                              <p className="text-slate-500 text-sm">No contract history found.</p>
                              <Link href="/upload" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Start your first audit →</Link>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer  />
    </div>
  )
}
