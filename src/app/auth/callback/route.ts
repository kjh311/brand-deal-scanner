import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful authentication - check if first time user
      const { data: { user } } = await supabase.auth.getUser()
      const next = searchParams.get('next') ?? '/history'
      
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
