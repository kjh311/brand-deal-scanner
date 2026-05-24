import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Optional: support a 'next' param to redirect to a specific page after login
  const next = searchParams.get('next') ?? '/history'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful authentication - redirect to dashboard (or the 'next' param)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If exchange fails or no code is present, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
