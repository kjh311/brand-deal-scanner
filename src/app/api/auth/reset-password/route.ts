import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/emails/send-password-reset'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim()

    const isProduction = process.env.NODE_ENV === 'production'
    const baseUrl = isProduction
      ? 'https://www.branddealfixer.com'
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const redirectTo = `${baseUrl}/update-password`

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: trimmedEmail,
      options: {
        redirectTo,
      },
    })

    if (linkError) {
      console.error('[API Reset Password] Failed to generate recovery link:', linkError.message)
      return NextResponse.json({ error: linkError.message }, { status: 400 })
    }

    const resetLink = linkData?.properties?.action_link

    if (!resetLink) {
      console.error('[API Reset Password] No action link returned')
      return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 })
    }

    const emailResult = await sendPasswordResetEmail({
      email: trimmedEmail,
      resetLink,
    })

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API Reset Password] Error:', error.message || error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
