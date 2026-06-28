'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
  variant?: 'login' | 'signup'
}

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  const isSignup = variant === 'signup'

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-6 bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F]">
      {/* Blurred Background Aesthetics (Static) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[70%] h-[70%] bg-white/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[70%] bg-white/10 blur-[120px] rounded-full"></div>
        
        <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-white/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/5 blur-[150px] rounded-full"></div>
      </div>

      <header className="absolute top-8 left-8">
        <Link href="/" className="font-headline text-xl font-bold text-on-surface">
          Brand Deal Fixer
        </Link>
      </header>

      <main className="relative z-10 w-full flex flex-col items-center">
        {children}
        
        {/* Mandatory Legal Disclaimer */}
        <footer className="mt-12 text-[10px] md:text-xs text-on-surface-variant max-w-sm text-center font-mono uppercase tracking-widest leading-relaxed">
          LEGAL DISCLAIMER: Brand Deal Fixer is an AI analysis tool and does not provide legal advice.
        </footer>
      </main>
    </div>
  )
}
