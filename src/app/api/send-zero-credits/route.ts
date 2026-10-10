import { NextResponse } from 'next/server';
import { sendZeroCreditsEmail } from '@/lib/emails/send-zero-credits';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  console.log('[Send Zero Credits API] POST request received');
  try {
    let targetEmail: string | null = null;

    // 1. Try parsing JSON body if present
    try {
      const body = await request.json();
      if (body && typeof body.email === 'string') {
        targetEmail = body.email.trim();
      }
    } catch {
      // Body may be empty or invalid JSON
    }

    // 2. Auth Check: Allow Service Role Key OR Anon Key OR Authenticated User Session
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    const isAuthorizedToken = 
      !!token && (
        (process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY) ||
        (process.env.SUPABASE_ANON_KEY && token === process.env.SUPABASE_ANON_KEY)
      );

    if (!isAuthorizedToken) {
      // Check authenticated user session fallback
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          if (!targetEmail) targetEmail = user.email;
        } else {
          console.warn('[Send Zero Credits API] Unauthorized request: no valid token or session');
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } catch (authErr: any) {
        console.warn('[Send Zero Credits API] Session auth error:', authErr.message);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Send Zero Credits API] Target email:', targetEmail);

    if (!targetEmail) {
      console.warn('[Send Zero Credits API] Bad request: target email is missing');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[Send Zero Credits API] Triggering sendZeroCreditsEmail for:', targetEmail);
    const data = await sendZeroCreditsEmail({ email: targetEmail });
    console.log('[Send Zero Credits API] sendZeroCreditsEmail output:', JSON.stringify(data));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Send Zero Credits API] Fatal error:', error.message || error);
    const message = error instanceof Error ? error.message : 'Failed to send zero credits email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
