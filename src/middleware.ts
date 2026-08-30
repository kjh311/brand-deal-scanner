import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getUnderConstructionHTML(showError: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Under Construction</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      background: radial-gradient(circle at center, #1E1A5F 0%, #0B0826 100%);
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      padding: 40px;
      border-radius: 32px;
      text-align: center;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    p {
      color: rgba(255, 255, 255, 0.6);
      font-size: 15px;
      margin: 0 0 32px 0;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 20px;
      border-radius: 16px;
      color: white;
      font-size: 15px;
      text-align: center;
      outline: none;
      transition: all 0.2s;
    }
    input:focus {
      border-color: #D84C9F;
      background: rgba(255, 255, 255, 0.08);
    }
    button {
      background: #D84C9F;
      border: none;
      color: white;
      font-weight: 700;
      padding: 16px;
      border-radius: 16px;
      font-size: 15px;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
    }
    button:hover {
      opacity: 0.95;
      transform: scale(1.02);
    }
    .error-msg {
      color: #EF4444;
      font-size: 13px;
      margin-top: 12px;
      font-weight: 600;
      display: ${showError ? 'block' : 'none'};
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Site under construction</h1>
    <p>Check back soon</p>
    <form id="auth-form" class="input-group">
      <input type="password" id="pass" placeholder="Enter password to access" required autocomplete="off">
      <button type="submit">Access Site</button>
      <div id="error" class="error-msg">Incorrect password. Please try again.</div>
    </form>
  </div>
  <script>
    const form = document.getElementById('auth-form');
    const input = document.getElementById('pass');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = input.value;
      
      // Set the password cookie and reload
      document.cookie = "bypass_password=" + encodeURIComponent(pwd) + "; path=/; max-age=604800; SameSite=Lax";
      window.location.reload();
    });
  </script>
</body>
</html>`
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Bypass all checks for Stripe webhooks and other API/static routes
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // 2. Check for the password cookie to bypass construction block
  const bypassPassword = request.cookies.get('bypass_password')?.value
  const correctPassword = process.env.SITE_PASSWORD || 'mysecretpassword'

  if (bypassPassword !== correctPassword) {
    const showValidationError = !!bypassPassword
    const response = new NextResponse(
      getUnderConstructionHTML(showValidationError),
      {
        status: 401,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )

    if (showValidationError) {
      response.cookies.delete('bypass_password')
    }

    return response
  }

  // 3. Supabase session sync & route protection for authorized visitors
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
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

  const protectedRoutes = ['/upload', '/analysis', '/history']

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  )

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/signup'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (stripe webhooks)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
}
