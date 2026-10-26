import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/history'

  console.log('[Auth Callback] Processing code exchange. Target:', next)

  if (code) {
    const cookieStore = await cookies()
    const redirectUrl = `${origin}${next}`

    // Create response object early so Supabase can attach Set-Cookie headers directly to it
    let response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // Server Component context fallback
              }
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.user) {
      console.log('[Auth Callback] Session established for user:', sessionData.user.email)

      // Password reset target: return response with attached cookies immediately
      if (next === '/update-password') {
        return response
      }

      // ── New-user detection ────────────────────────────────────────────────
      // Check for an existing profile BEFORE sending any email.
      // A missing profile row means this is a first-time signup; an existing
      // row means a returning user logging in — skip the welcome email.
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, user_name')
        .eq('id', sessionData.user.id)
        .maybeSingle()

      const isNewUser = !existingProfile

      if (isNewUser) {
        console.log('[Auth Callback] New user detected — sending welcome email:', sessionData.user.email)
        try {
          const email = sessionData.user.email
          const name =
            sessionData.user.user_metadata?.full_name ||
            sessionData.user.user_metadata?.username ||
            sessionData.user.user_metadata?.name

          if (email) {
            await sendWelcomeEmail({ email, name })
          }
        } catch (err) {
          console.error('[Auth Callback] Welcome email trigger error:', err)
        }
      } else {
        console.log('[Auth Callback] Returning user — skipping welcome email:', sessionData.user.email)
      }

      // Redirect new users (or users with no username yet) to settings
      if (!existingProfile?.user_name) {
        const settingsResponse = NextResponse.redirect(`${origin}/settings`)
        response.cookies.getAll().forEach((c) => {
          settingsResponse.cookies.set(c.name, c.value, c)
        })
        return settingsResponse
      }

      return response
    } else if (error) {
      console.error('[Auth Callback] Exchange code error:', error.message)
    }
  }

  // If code exchange fails or no code is present, redirect gracefully to forgot-password
  return NextResponse.redirect(`${origin}/forgot-password?error=link_expired`)
}
