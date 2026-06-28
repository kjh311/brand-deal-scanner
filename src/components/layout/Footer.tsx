'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface FooterProps {
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const fetchAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('admin')
          .eq('id', user.id)
          .single()
        if (data?.admin) setIsAdmin(true)
      }
    }
    fetchAdmin()
  }, [])

  return (
    <footer ref={footerRef} className={`w-full py-16 z-[100] border-t border-white/5 bg-black ${className}`} id="main-footer">
      <div className="max-w-[1280px] mx-auto px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-headline text-2xl font-bold text-white tracking-tighter">
            Brand Deal <span className="text-primary font-bold tracking-normal">Fixer</span>
          </div>
          <p className="text-sm text-slate-500 text-center md:text-left">
            © 2026 Brand Deal Fixer. AI Auditor for Creators.
          </p>
          <div className="flex gap-8">
            {isAdmin && (
              <Link href="/admin" className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 hover:text-white transition-colors duration-200">
                Admin
              </Link>
            )}
            <a href="#" className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 hover:text-white transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 hover:text-white transition-colors duration-200">
              Terms
            </a>
            <a href="#" className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 hover:text-white transition-colors duration-200">
              Support
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-medium max-w-[700px] mx-auto uppercase tracking-[1px]">
            LEGAL DISCLAIMER: Brand Deal Fixer is an AI analysis tool and does not provide legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
