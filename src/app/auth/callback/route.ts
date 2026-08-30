import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/history'

  console.log('[Auth Callback] Processing code exchange...')

  if (code) {
    const supabase = await createClient()
    const { data: session, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      console.log('[Auth Callback] User confirmed:', session.user.email)

      // Send welcome email (non-blocking - errors should not break auth flow)
      try {
        const email = session.user.email
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.username || session.user.user_metadata?.name

        if (email) {
          console.log('[Auth Callback] Triggering welcome email to:', email)
          await sendWelcomeEmail({ email, name })
          console.log('[Auth Callback] Welcome email sent successfully')
        }
      } catch (err) {
        console.error('[Auth Callback] Email trigger failed:', err)
      }

      // Check if user_name is set in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_name')
        .eq('id', session.user.id)
        .single()

      // If user_name is NULL, redirect to settings
      if (!profile?.user_name) {
        return NextResponse.redirect(`${origin}/settings`)
      }

      // Redirect to dashboard (or the 'next' param)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If exchange fails or no code is present, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
