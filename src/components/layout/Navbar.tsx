'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <header className="sticky top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-surface/80 shadow-sm">
      <nav className="flex justify-between items-center max-w-[1280px] mx-auto px-10 py-4">
        <div className="flex items-center gap-2">
          <div className="font-headline text-2xl font-bold tracking-tight text-on-surface">
            Brand Deal Scanner
          </div>
        </div>
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
        <Link 
          href="/login" 
          className="active:scale-95 transition-transform px-6 py-2 rounded-full bg-primary text-on-primary font-bold"
        >
          Login
        </Link>
      </nav>
    </header>
  )
}
