'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { handlePortal } from '@/lib/stripe-client'

import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number>(0)
  const [plan, setPlan] = useState<string>('Free')
  const [hasActivePlan, setHasActivePlan] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, plan, stripe_customer_id')
          .eq('id', user.id)
          .single()
          
        if (profile) {
          setCredits(profile.credits || 0)
          setPlan(profile.plan || 'Free')
          setHasActivePlan(!!profile.stripe_customer_id)
        }
      }
      setLoading(false)
    }
    getData()
  }, [])

  const handleUpdatePlan = async () => {
    if (!hasActivePlan) {
      router.push('/plans')
      return
    }

    setUpdating(true)
    try {
      await handlePortal('update')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!hasActivePlan) return

    setCancelling(true)
    try {
      await handlePortal('manage')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">

      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 md:px-10 max-w-[1000px] mx-auto w-full">
        <div className="space-y-12">
          
          <header className="space-y-2">
            <h1 className="font-headline text-4xl font-black tracking-tight text-white mb-2">Account Settings</h1>
            <p className="text-slate-500">Manage your subscription, profile preferences, and credit balance.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar Controls */}
            <nav className="space-y-2">
              <button className="w-full text-left px-6 py-4 rounded-2xl bg-white/10 text-white font-bold border border-white/10 shadow-lg transition-all cursor-pointer">
                Plan & Billing
              </button>
              <button className="w-full text-left px-6 py-4 rounded-2xl hover:bg-white/5 text-slate-400 font-medium transition-all cursor-pointer">
                Security
              </button>
              <button className="w-full text-left px-6 py-4 rounded-2xl hover:bg-white/5 text-slate-400 font-medium transition-all cursor-pointer">
                Preference
              </button>
            </nav>

            <div className="md:col-span-2 space-y-8">
              
              {/* Profile Card */}
              <section className="glass-panel border border-white/10 rounded-[2.5rem] p-10 bg-white/[0.02] space-y-8">
                <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                   <div className="w-20 h-20 rounded-3xl border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-white/5 shadow-2xl">
                      {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-4xl">person</span>
                      )}
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-white">{user?.user_metadata?.full_name || 'Creator'}</h2>
                      <p className="text-slate-500 text-sm">{user?.email}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 rounded-3xl bg-black/40 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mb-2">Current Plan</p>
                      <p className="text-xl font-bold text-emerald-400 capitalize">{plan}</p>
                   </div>
                   <div className="p-6 rounded-3xl bg-black/40 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mb-2">Available Credits</p>
                      <p className="text-xl font-bold text-white">{credits} Scans</p>
                   </div>
                </div>
              </section>

              {/* Billing Management */}
              <section className="glass-panel border border-white/10 rounded-[2.5rem] p-10 bg-white/[0.02]">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-white">Subscription Management</h3>
                      <p className="text-sm text-slate-500">
                        {hasActivePlan ? 'Manage your billing and tier' : 'Upgrade to a paid plan to get more scans'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                       <span className="material-symbols-outlined text-emerald-500">payments</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {credits === 0 && (
                      <button 
                        onClick={() => router.push('/upload')}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm hover:scale-[1.01] transition-transform shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        Purchase Top Ups
                      </button>
                    )}
                    <button 
                      onClick={handleUpdatePlan}
                      disabled={updating}
                      className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:scale-[1.01] transition-transform shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {updating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        hasActivePlan ? 'Modify Subscription' : 'Upgrade Plan'
                      )}
                    </button>
                    <button 
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="w-full py-4 rounded-2xl border border-rose-500/20 text-rose-500 font-bold text-sm hover:bg-rose-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {cancelling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </button>
                 </div>
                 
                 <p className="mt-6 text-center text-[10px] text-slate-600 font-medium uppercase tracking-[2px]">
                   Secured by Stripe Billing
                 </p>
              </section>

              {/* Data Transparency */}
              <section className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex gap-6 items-start">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                     <span className="material-symbols-outlined text-amber-500">verified_user</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">Privacy Dashboard</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      We prioritize your sensitive contract data. All original documents are permanently deleted 
                      after the AI Audit process is complete. Your Scan History only stores the resulting risk analysis.
                    </p>
                  </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
