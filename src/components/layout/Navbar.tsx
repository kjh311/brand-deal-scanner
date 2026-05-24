'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const getUserAndCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credit_balance')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCredits(profile.credit_balance)
        }
      }
      setLoading(false)
    }

    getUserAndCredits()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUserAndCredits()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-surface/80 shadow-sm">
      <nav className="flex justify-between items-center max-w-[1280px] mx-auto px-10 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
          <div className="font-headline text-2xl font-bold tracking-tight text-on-surface">
            Brand Deal Scanner
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="#how-it-works" 
            className="text-primary font-bold border-b-2 border-primary text-xs uppercase tracking-wider"
          >
            How it Works
          </Link>
          <Link 
            href="#pricing" 
            className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 ease-in-out text-xs uppercase tracking-wider"
          >
            Pricing
          </Link>
          <Link 
            href="#testimonials" 
            className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 ease-in-out text-xs uppercase tracking-wider"
          >
            Success Stories
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!loading && user ? (
            <>
              {credits !== null && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/60 border border-white/10 text-sm">
                  <span className="material-symbols-outlined text-primary text-lg">token</span>
                  <span>{credits} Audits Remaining</span>
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="active:scale-95 transition-transform px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="active:scale-95 transition-transform px-6 py-2 rounded-full bg-primary text-on-primary font-bold"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
