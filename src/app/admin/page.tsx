import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[3rem] p-10 md:p-12 shadow-2xl">
          <h1 className="font-headline text-4xl font-bold tracking-tight mb-4">
            Admin Dashboard
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Welcome, {user.user_metadata?.full_name || user.email}. You have administrator access.
          </p>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">User Management</h2>
              <p className="text-white/60 text-sm">Manage users and permissions here.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">System Settings</h2>
              <p className="text-white/60 text-sm">Configure application settings and features.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">Analytics Overview</h2>
              <p className="text-white/60 text-sm">View platform usage and metrics.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
