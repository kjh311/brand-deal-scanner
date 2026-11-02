import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Routes that are always publicly accessible — no password or auth required.
 * Google OAuth reviewers, crawlers, and new visitors must be able to reach these.
 */
const PUBLIC_PATHS = ['/', '/privacy', '/terms', '/support', '/access-gate']

/**
 * Prefix-based public paths (e.g. /access-gate/... API sub-routes).
 * Keeps the gate page, its submission endpoint, and Stripe webhooks loop-free.
 * Stripe POSTs to /api/webhooks/stripe have no cookies/session — they must
 * always bypass the auth gate or they'll get a 307 redirect and fail.
 */
const PUBLIC_PREFIXES = ['/access-gate', '/api/access-gate', '/api/webhooks']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── [TESTING MODE — access gate disabled] ────────────────────────────────
  // All routes pass through. Supabase session is still refreshed so auth
  // state works correctly. Re-enable the gate by restoring the block below.
  //
  // TO RE-ENABLE: uncomment everything between the RE-ENABLE markers and
  // delete the early-return pass-through block that follows.

  // ── Supabase session sync (always runs so cookies stay fresh) ────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse

  /* ── RE-ENABLE START ──────────────────────────────────────────────────────

  // ── 1. Always pass through public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── 2. Site-access cookie gate
  const siteAccessPass = request.cookies.get('site_access_pass')?.value
  if (siteAccessPass === 'true') {
    // fall through to session sync below
  } else {
    // ── 3. Supabase session check
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const gateUrl = request.nextUrl.clone()
      gateUrl.pathname = '/access-gate'
      gateUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(gateUrl)
    }

    return supabaseResponse
  }

  // ── 4. Cookie holder: sync Supabase session
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse

  ── RE-ENABLE END ─────────────────────────────────────────────────────── */
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static assets)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico
     *   - Common public static file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)',
  ],
}
