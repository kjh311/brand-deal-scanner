import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[Send Welcome API] Received request payload:', body)

    // Handle both direct POST payloads and Supabase webhook payloads
    const email = body.email || body.record?.email
    const name = body.name || body.record?.raw_user_meta_data?.full_name || body.record?.raw_user_meta_data?.user_name

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const data = await sendWelcomeEmail({ email, name })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Send Welcome API] Resend error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
