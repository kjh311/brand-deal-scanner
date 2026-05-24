import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/features/Hero'
import { TrustSection } from '@/components/features/TrustSection'
import { HowItWorks } from '@/components/features/HowItWorks'
import { PricingSection } from '@/components/features/PricingSection'
import { TestimonialsSection } from '@/components/features/TestimonialsSection'
import { Footer } from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <TrustSection />
        <HowItWorks />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
