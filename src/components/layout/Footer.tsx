'use client'

import React, { useEffect, useRef } from 'react'

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)

  return (
    <footer ref={footerRef} className="w-full py-16 border-t border-white/5 bg-black" id="main-footer">
      <div className="max-w-[1280px] mx-auto px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-headline text-2xl font-bold text-white tracking-tighter">
            Brand Deal <span className="text-primary font-bold tracking-normal">Scanner</span>
          </div>
          <p className="text-sm text-slate-500 text-center md:text-left">
            © 2026 Brand Deal Scanner. AI Auditor for Creators.
          </p>
          <div className="flex gap-8">
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
            LEGAL DISCLAIMER: Brand Deal Scanner is an AI analysis tool and does not provide legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
