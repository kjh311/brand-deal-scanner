import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful authentication - fetch user details
      const { data: { user } } = await supabase.auth.getUser()
      const next = searchParams.get('next') ?? '/history'

      // Send welcome email (non-blocking - errors should not break auth flow)
      if (user?.email) {
        try {
          await fetch(`${origin}/api/send-welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.user_metadata?.full_name,
            }),
          })
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError)
        }
      }

      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_name')
          .eq('id', user.id)
          .single()
        
        // If user_name is NULL, redirect to settings
        if (!profile?.user_name) {
          return NextResponse.redirect(`${origin}/settings`)
        }
      }
      
      // Redirect to dashboard (or the 'next' param)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If exchange fails or no code is present, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
