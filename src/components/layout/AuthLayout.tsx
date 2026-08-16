'use client'

import { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface AuthLayoutProps {
  children: ReactNode
  variant?: 'login' | 'signup'
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col pt-24 bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      {/* Blurred Background Aesthetics (Static) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[70%] h-[70%] bg-white/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[70%] bg-white/10 blur-[120px] rounded-full"></div>

        <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-white/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/5 blur-[150px] rounded-full"></div>
      </div>

      <Navbar />

      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        {children}
      </main>

      <Footer />
    </div>
  )
}
