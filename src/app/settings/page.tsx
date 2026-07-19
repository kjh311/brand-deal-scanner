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
          
          <header className="space-y-2 text-center">
            <h1 className="font-headline text-4xl font-black tracking-tight text-white mb-2">Account Settings</h1>
            <p className="text-white/70">Modify your subscription and credit balance.</p>
          </header>
 
          <div className="max-w-2xl mx-auto space-y-8">
                            {/* Profile Card */}
               <section className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-5 sm:p-10 space-y-8 text-[#1E1A5F]">
                 <div className="flex items-center gap-6 pb-8 border-b border-[#E2E8F0]">
                    <div className="w-20 h-20 rounded-3xl border-2 border-[#D84C9F]/30 flex items-center justify-center overflow-hidden bg-[#F8FAFC] shadow-2xl shrink-0">
                       {user?.user_metadata?.avatar_url ? (
                         <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <span className="material-symbols-outlined text-[#D84C9F] text-4xl">person</span>
                       )}
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-[#1E1A5F]">{user?.user_metadata?.full_name || 'Creator'}</h2>
                       <p className="text-[#64748B] text-sm">{user?.email}</p>
                    </div>
                 </div>
 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0]">
                       <p className="text-[10px] font-black uppercase tracking-[3px] text-[#64748B] mb-2">Current Plan</p>
                       <p className="text-xl font-bold text-emerald-600 capitalize">{plan}</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0]">
                       <p className="text-[10px] font-black uppercase tracking-[3px] text-[#64748B] mb-2">Available Credits</p>
                       <p className="text-xl font-bold text-[#1E1A5F]">{credits} Scans</p>
                    </div>
                 </div>
               </section>

               {/* Billing Management */}
               <section className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-5 sm:p-10 text-[#1E1A5F]">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="text-xl font-bold text-[#1E1A5F]">Subscription Management</h3>
                       <p className="text-sm text-[#64748B]">
                         {hasActivePlan ? 'Manage your billing and tier' : 'Upgrade to a paid plan to get more scans'}
                       </p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                        <span className="material-symbols-outlined text-emerald-600">payments</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {credits === 0 && (
                       <button 
                         onClick={() => router.push('/upload')}
                         className="w-full py-4 rounded-2xl bg-[#D84C9F] hover:brightness-110 text-white font-black text-sm hover:scale-[1.01] transition-transform shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                       >
                         <span className="material-symbols-outlined text-sm">bolt</span>
                         Purchase Top Ups
                       </button>
                     )}
                     <button 
                       onClick={handleUpdatePlan}
                       disabled={updating}
                       className="w-full py-4 rounded-2xl bg-[#1E1A5F] text-white font-black text-sm hover:scale-[1.01] transition-transform shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                     >
                       {updating ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Connecting...
                         </>
                       ) : (
                         hasActivePlan ? 'Modify Subscription' : 'Upgrade Plan'
                       )}
                     </button>
                     <button 
                       onClick={handleCancelSubscription}
                       disabled={cancelling}
                       className="w-full py-4 rounded-2xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                     >
                       {cancelling ? (
                         <>
                           <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                           Redirecting...
                         </>
                       ) : (
                         'Cancel Subscription'
                       )}
                     </button>
                  </div>
                  
                  <p className="mt-6 text-center text-[10px] text-[#64748B] font-medium uppercase tracking-[2px]">
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
                     <p className="text-sm text-white/70 leading-relaxed">
                       We prioritize your sensitive contract data. All original documents are permanently deleted 
                       after the AI Audit process is complete. Your Scan History only stores the resulting risk analysis.
                     </p>
                  </div>
              </section>
 
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
