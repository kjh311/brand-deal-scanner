import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/features/Hero'
import { HowItWorks } from '@/components/features/HowItWorks'
import { TrustSection } from '@/components/features/TrustSection'
import { PricingSection } from '@/components/features/PricingSection'
import { Footer } from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <TrustSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
