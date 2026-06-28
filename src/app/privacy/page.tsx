import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-2xl w-full bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F]">
          <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">Privacy Policy</h1>
          <p className="text-sm text-[#64748B] mb-8">Last updated: June 2026</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              Brand Deal Fixer (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our services.
            </p>

            <h2 className="text-lg font-bold mt-8">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email address, and any documents you upload for analysis. We also collect usage data to improve our services.
            </p>

            <h2 className="text-lg font-bold mt-8">2. How We Use Your Information</h2>
            <p>
              Your information is used solely to provide and improve our contract analysis services. We do not sell or share your personal data with third parties for marketing purposes.
            </p>

            <h2 className="text-lg font-bold mt-8">3. Data Storage and Security</h2>
            <p>
              Documents are processed in memory and immediately purged after analysis. We use industry-standard security measures to protect your data.
            </p>

            <h2 className="text-lg font-bold mt-8">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@branddealfixer.com.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
