import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-2xl w-full bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F]">
          <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">Support</h1>
          <p className="text-sm text-[#64748B] mb-8">We&apos;re here to help. Reach out through any of the channels below.</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              Our support team is available to assist you with any questions or issues you may encounter while using Brand Deal Fixer.
            </p>

            <h2 className="text-lg font-bold mt-8">Contact Options</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Email support: <span className="font-mono text-[#D84C9F]">support@branddealfixer.com</span></li>
              <li>Response time: Within 24–48 business hours</li>
              <li>Live chat: Coming soon</li>
            </ul>

            <h2 className="text-lg font-bold mt-8">Frequently Asked Questions</h2>

            <h3 className="font-bold mt-4">How do I upgrade my plan?</h3>
            <p>Visit the Settings page and select &quot;Upgrade Plan&quot; to view available options.</p>

            <h3 className="font-bold mt-4">Are my documents stored?</h3>
            <p>No. Documents are processed in memory and immediately purged after analysis.</p>

            <h3 className="font-bold mt-4">Can I cancel my subscription?</h3>
            <p>Yes. You can cancel at any time from the Subscription Management section in Settings.</p>

            <h2 className="text-lg font-bold mt-8">Still Need Help?</h2>
            <p>
              If you couldn&apos;t find what you were looking for, feel free to reach out to our support team at the email above.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
