import { NextResponse } from 'next/server';
import { sendZeroCreditsEmail } from '@/lib/emails/send-zero-credits';
import { createClient } from '@/lib/supabase/server';

// In-memory debounce cache to prevent duplicate dispatches within 60 seconds
const recentDispatches = new Map<string, number>();
const DEBOUNCE_WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  console.log('[Send Zero Credits API] POST request received');
  try {
    let targetEmail: string | null = null;

    // 1. Parse JSON body if present
    try {
      const body = await request.json();
      if (body && typeof body.email === 'string') {
        targetEmail = body.email.trim();
      }
    } catch {
      // Body may be empty or plain text
    }

    // 2. Fallback to authenticated user session if targetEmail is missing
    if (!targetEmail) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          targetEmail = user.email;
        }
      } catch (authErr: any) {
        console.warn('[Send Zero Credits API] Session lookup note:', authErr.message);
      }
    }

    console.log('[Send Zero Credits API] Target email identified:', targetEmail);

    if (!targetEmail) {
      console.warn('[Send Zero Credits API] Bad request: target email is missing');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 3. Deduplication / Debounce Check
    const normalizedEmail = targetEmail.toLowerCase();
    const now = Date.now();
    const lastSent = recentDispatches.get(normalizedEmail);

    if (lastSent && now - lastSent < DEBOUNCE_WINDOW_MS) {
      console.log(`[Send Zero Credits API] Suppressing duplicate send for ${normalizedEmail} (last sent ${now - lastSent}ms ago)`);
      return NextResponse.json({ success: true, duplicateSuppressed: true });
    }

    // Record this dispatch
    recentDispatches.set(normalizedEmail, now);

    // Occasional cleanup of expired cache entries
    if (recentDispatches.size > 500) {
      for (const [key, timestamp] of recentDispatches.entries()) {
        if (now - timestamp > DEBOUNCE_WINDOW_MS) {
          recentDispatches.delete(key);
        }
      }
    }

    console.log('[Send Zero Credits API] Triggering sendZeroCreditsEmail for:', targetEmail);
    const data = await sendZeroCreditsEmail({ email: targetEmail });
    console.log('[Send Zero Credits API] sendZeroCreditsEmail result:', JSON.stringify(data));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Send Zero Credits API] Fatal error:', error.message || error);
    const message = error instanceof Error ? error.message : 'Failed to send zero credits email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
