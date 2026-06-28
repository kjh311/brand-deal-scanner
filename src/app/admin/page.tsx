import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AdminFeedbackView } from '@/components/admin/AdminFeedbackView'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin')
    .eq('id', user.id)
    .single()

  if (!profile?.admin) {
    redirect('/')
  }

  const { data: feedback, error: feedbackError } = await supabase
    .from('scan_feedback')
    .select('*, profiles(email)')
    .eq('dismissed', false)
    .order('created_at', { ascending: false })

  if (feedbackError) {
    console.error('Failed to load feedback:', feedbackError)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-32 p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center mb-8">
            <h1 className="font-headline text-4xl font-bold tracking-tight mb-2">
              Admin Dashboard
            </h1>
            <p className="text-white/80 text-lg">
              Welcome, {user.user_metadata?.full_name || user.email}. You have administrator access.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-[#1E1A5F]">
              <h2 className="text-xl font-bold mb-2">User Management</h2>
              <p className="text-[#64748B] text-sm">Manage users and permissions here.</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-[#1E1A5F]">
              <h2 className="text-xl font-bold mb-2">System Settings</h2>
              <p className="text-[#64748B] text-sm">Configure application settings and features.</p>
            </div>
          </div>

          <AdminFeedbackView initialFeedback={feedback || []} />
          {feedbackError && (
            <p className="text-rose-400 text-sm text-center">
              Error loading feedback: {feedbackError.message}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
