import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Routes that are always publicly accessible — no password or auth required.
 * Google OAuth reviewers, crawlers, and new visitors must be able to reach these.
 */
const PUBLIC_PATHS = ['/', '/privacy', '/terms', '/support', '/access-gate']

/**
 * Prefix-based public paths (e.g. /access-gate/... API sub-routes).
 * Keeps the gate page and its submission endpoint loop-free.
 */
const PUBLIC_PREFIXES = ['/access-gate', '/api/access-gate']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Always pass through public routes ─────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── 2. Site-access cookie gate ───────────────────────────────────────────
  // A visitor who has entered the correct TESTING_SITE_PASSWORD gets a
  // `site_access_pass=true` cookie (set by /api/access-gate).
  const siteAccessPass = request.cookies.get('site_access_pass')?.value
  if (siteAccessPass === 'true') {
    // Cookie holder is cleared through the gate — fall through to Supabase
    // session sync below so auth state is always refreshed.
  } else {
    // ── 3. Supabase session check (runs for every non-public, non-cookie path)
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Not authenticated and no access cookie → send to the gate
      const gateUrl = request.nextUrl.clone()
      gateUrl.pathname = '/access-gate'
      // Preserve the original destination so the gate can redirect back
      gateUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(gateUrl)
    }

    // User is authenticated — return the supabase-refreshed response
    return supabaseResponse
  }

  // ── 4. Cookie holder: still sync Supabase session so cookies stay fresh ──
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

  // Refresh the session (ignore the result — we already passed the cookie gate)
  await supabase.auth.getUser()

  return supabaseResponse
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
