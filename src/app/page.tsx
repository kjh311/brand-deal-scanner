import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/features/Hero'
import { HowItWorks } from '@/components/features/HowItWorks'
import { TrustSection } from '@/components/features/TrustSection'
import { TestimonialsSection } from '@/components/features/TestimonialsSection'
import { Footer } from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <TrustSection />

        {/* Plans CTA */}
        <div className="bg-white/5 border-y border-white/10 py-16 sm:py-20 px-5 sm:px-10">
          <div className="max-w-[1280px] mx-auto text-center">
            <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em] mb-4">
              Find Your Plan
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Choose the plan that fits your brand partnership needs. Scan deals, negotiate terms, and protect your revenue.
            </p>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-white text-[#221A7F] font-bold text-lg hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              View All Plans
            </Link>
          </div>
        </div>

        <TestimonialsSection />

      </main>
      <Footer />
    </div>
  )
}
