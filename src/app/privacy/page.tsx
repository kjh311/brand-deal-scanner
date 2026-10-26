import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-start justify-center pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-3xl w-full bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F] space-y-6">
          <h1 className="font-headline text-3xl font-bold tracking-tight mb-2">Brand Deal Fixer Privacy Policy</h1>
          <p className="text-sm text-[#64748B] mb-6">Last updated: October 2026</p>

          <p>
            <strong>Brand Deal Fixer</strong> ("we," "our," or "us") provides contract analysis services at{' '}
            <a href="https://www.branddealfixer.com" className="text-indigo-600 underline">https://www.branddealfixer.com</a>.
            This Privacy Policy details how we collect, use, store, and protect your personal data and Google account information.
          </p>

          <hr className="my-6 border-slate-200" />

          <h2 className="text-xl font-bold mt-6 mb-2">1. Google User Data & OAuth Scopes</h2>
          <p>
            When you sign in using Google OAuth, Brand Deal Fixer requests access to basic account identification scopes. Our use of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-slate-200 text-left text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 border border-slate-200 font-semibold">Google Scope</th>
                  <th className="p-3 border border-slate-200 font-semibold">Purpose & Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-slate-200"><code>openid</code></td>
                  <td className="p-3 border border-slate-200">To securely authenticate your active session.</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200"><code>.../auth/userinfo.email</code></td>
                  <td className="p-3 border border-slate-200">To associate your subscription credits and audit history with your email address.</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200"><code>.../auth/userinfo.profile</code></td>
                  <td className="p-3 border border-slate-200">To display your name and profile image in your account dashboard.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
            <strong>Limited Use Guarantee:</strong> We do not sell, transfer, or share Google user data with third-party advertising networks, data brokers, or research entities. We do not use Google account data to train machine learning or AI models.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">2. Contract Uploads & AI Processing</h2>
          <p>
            To provide contract auditing, uploaded document text is processed securely via enterprise <strong>Google Cloud Gemini API</strong> endpoints.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>No Model Training:</strong> Under our enterprise API terms, your uploaded contract text, summaries, and generated email drafts are never used to train public AI models.</li>
            <li><strong>Encryption:</strong> Data is encrypted in transit using TLS 1.3 and stored at rest using AES-256 database encryption.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">3. Third-Party Services</h2>
          <p>
            Payment processing is strictly handled by <strong>Stripe</strong>. Brand Deal Fixer does not store or process payment card details on its servers. Review <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Stripe's Privacy Policy</a> for payment security details.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">4. Data Retention & Deletion Rights</h2>
          <p>
            You have the right to request full account deletion and erasure of all stored audit logs. To request account or data removal, email us at{' '}
            <a href="mailto:support@branddealfixer.com" className="text-indigo-600 underline">support@branddealfixer.com</a>.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">5. Contact Us</h2>
          <p>
            For privacy inquiries, contact support at: <br />
            Email: <a href="mailto:support@branddealfixer.com" className="text-indigo-600 underline">support@branddealfixer.com</a> <br />
            Website: <a href="https://www.branddealfixer.com" className="text-indigo-600 underline">https://www.branddealfixer.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}