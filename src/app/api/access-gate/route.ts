import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { password, next } = body as { password?: string; next?: string }

  // Accept either name so existing .env files don't need to change
  const correctPassword =
    process.env.TESTING_SITE_PASSWORD || process.env.SITE_PASSWORD
  if (!correctPassword) {
    // If the env var is not set, deny access to avoid accidentally open gates
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (!password || password !== correctPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Password correct — set the access cookie and return the redirect destination
  const redirectTo = next && next.startsWith('/') ? next : '/'
  const response = NextResponse.json({ ok: true, redirectTo })

  response.cookies.set('site_access_pass', 'true', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // 7 days — re-enter password if they clear cookies or it expires
    maxAge: 60 * 60 * 24 * 7,
    // Secure in production; dev will work over http
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
