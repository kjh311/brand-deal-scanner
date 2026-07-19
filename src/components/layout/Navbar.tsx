'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // 1. Handle Authentication and Initial Fetch
  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, plan, admin')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCredits(profile.credits)
          setPlan(profile.plan)
          setIsAdmin(profile.admin || false)
        }
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUser()
      } else {
        setCredits(null)
      }
    })

    // Click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 2. Handle Real-time Credit Updates
  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()

    const channel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.credits !== undefined) {
            setCredits(payload.new.credits)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const fetchUnreadCount = async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('scan_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('dismissed', false)
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchUnreadCount()

    const supabase = createClient()
    const channel = supabase
      .channel('feedback-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scan_feedback',
      }, () => {
        fetchUnreadCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const menuItems = user ? [
    { label: 'New Scan', icon: 'upload_file', href: '/upload' },
    { label: 'Scan History', icon: 'inventory_2', href: '/history' },
    { label: 'Settings', icon: 'settings', href: '/settings' },
    ...(isAdmin ? [{ label: 'Admin', icon: 'admin_panel_settings', href: '/admin' }] : []),
  ] : [
    { label: 'How it Works', icon: 'lightbulb', href: '/#how-it-works' },
    { label: 'Pricing', icon: 'payments', href: '/#pricing' },
    { label: 'Success Stories', icon: 'verified', href: '/#testimonials' },
  ]

  return (
    <header className="fixed top-0 w-full z-[150] backdrop-blur-xl border-b border-white/5 bg-black/40">
      <nav className="flex justify-between items-center max-w-[1280px] mx-auto px-6 md:px-10 py-4 relative">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-all duration-300 pointer-events-none drop-shadow-[0_0_15px_rgba(255,188,43,0.3)]">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="font-headline text-2xl font-black tracking-tighter text-white">
            Brand Deal <span className="text-primary tracking-normal font-bold">Fixer</span>
          </div>
        </Link>

        {/* Action Center */}
        <div className="flex items-center gap-4 relative" ref={menuRef}>
          {!loading && user && (
            <Link
              href="/upload"
               className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 text-xs font-black uppercase tracking-[2px] text-white cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-primary text-sm">token</span>
              <span>{credits ?? 0} Credits</span>
            </Link>
          )}

          {/* User Profile & Menu Trigger */}
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <>
                <Link
                  href="/settings"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all bg-white/5 shadow-inner p-[2px]"
                >
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-primary/60">account_circle</span>
                  )}
                 </Link>

                 {isAdmin && unreadCount > 0 && (
                   <Link
                     href="/admin"
                     className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:border-primary/50 transition-all cursor-pointer"
                   >
                     <span className="material-symbols-outlined text-white text-xl">notifications</span>
                     <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                       {unreadCount}
                     </span>
                   </Link>
                 )}

                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 rounded-xl hover:bg-white/5 cursor-pointer 
                    ${isMenuOpen ? 'bg-white/10' : ''}`}
                >
                  <div className={`h-[2px] bg-white transition-all duration-300 transform rounded-full ${isMenuOpen ? 'w-5 rotate-45 translate-y-[8px]' : 'w-5'}`} />
                  <div className={`h-[2px] bg-white transition-all duration-300 rounded-full ${isMenuOpen ? 'w-0 opacity-0' : 'w-3 opacity-100'}`} />
                  <div className={`h-[2px] bg-white transition-all duration-300 transform rounded-full ${isMenuOpen ? 'w-5 -rotate-45 -translate-y-[8px]' : 'w-5'}`} />
                </button>
              </>
            ) : (
              !loading && (
                <div className="flex items-center gap-4">
                  <Link href="/login" className="hidden md:inline-block text-xs font-black uppercase tracking-[2px] text-slate-400 hover:text-white transition-colors">Login</Link>
                  <Link
                    href="/login"
                    className="hidden md:inline-block px-6 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-[2px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Start Scanning
                  </Link>

                  {/* Logged Out Hamburger */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 rounded-xl hover:bg-white/5 cursor-pointer 
                        ${isMenuOpen ? 'bg-white/10' : ''}`}
                  >
                    <div className={`h-[2px] bg-white transition-all duration-300 transform rounded-full ${isMenuOpen ? 'w-5 rotate-45 translate-y-[8px]' : 'w-5'}`} />
                    <div className={`h-[2px] bg-white transition-all duration-300 rounded-full ${isMenuOpen ? 'w-0 opacity-0' : 'w-3 opacity-100'}`} />
                    <div className={`h-[2px] bg-white transition-all duration-300 transform rounded-full ${isMenuOpen ? 'w-5 -rotate-45 -translate-y-[8px]' : 'w-5'}`} />
                  </button>
                </div>
              )
            )}
          </div>

          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-[#0e0e0e] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 space-y-1">
                {menuItems.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors text-xl">{item.icon}</span>
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white">{item.label}</span>
                  </Link>
                ))}

                {user ? (
                  <div className="pt-2 mt-2 border-t border-white/5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl hover:bg-rose-500/10 transition-all group cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-rose-500 transition-colors text-xl">logout</span>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-rose-500">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 mt-2 border-t border-white/5">
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-primary/10 transition-all group"
                    >
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors text-xl">login</span>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-primary">Sign In</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-white/[0.02] p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-600">v2.1 Auditor Edition</p>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
