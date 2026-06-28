import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-2xl w-full bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F]">
          <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">Terms of Service</h1>
          <p className="text-sm text-[#64748B] mb-8">Last updated: June 2026</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              Welcome to Brand Deal Fixer. By accessing or using our services, you agree to be bound by these Terms of Service.
            </p>

            <h2 className="text-lg font-bold mt-8">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using our services, you agree to comply with these terms. If you do not agree, please do not use our services.
            </p>

            <h2 className="text-lg font-bold mt-8">2. Use of Services</h2>
            <p>
              Our services are provided for informational and educational purposes only. Brand Deal Fixer does not provide legal advice, and our outputs should not be considered a substitute for professional legal counsel.
            </p>

            <h2 className="text-lg font-bold mt-8">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree not to use the service for any unlawful purpose.
            </p>

            <h2 className="text-lg font-bold mt-8">4. Limitation of Liability</h2>
            <p>
              Brand Deal Fixer shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of our services.
            </p>

            <h2 className="text-lg font-bold mt-8">5. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service following any changes constitutes acceptance of those changes.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
