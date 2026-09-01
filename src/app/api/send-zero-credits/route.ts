import { NextResponse } from 'next/server';
import { sendZeroCreditsEmail } from '@/lib/emails/send-zero-credits';

export async function POST(request: Request) {
  console.log('[Send Zero Credits API] POST request received');
  try {
    const authHeader = request.headers.get('Authorization');
    const expectedToken = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

    console.log('[Send Zero Credits API] Expected service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Send Zero Credits API] Authorization header received:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || authHeader !== expectedToken) {
      console.warn('[Send Zero Credits API] Unauthorized request: tokens do not match');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    console.log('[Send Zero Credits API] Parsed target email:', email);

    if (!email) {
      console.warn('[Send Zero Credits API] Bad request: email is empty');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[Send Zero Credits API] Calling sendZeroCreditsEmail...');
    const data = await sendZeroCreditsEmail({ email });
    console.log('[Send Zero Credits API] sendZeroCreditsEmail resolved:', JSON.stringify(data));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Send Zero Credits API] Error:', error.message || error);
    const message = error instanceof Error ? error.message : 'Failed to send zero credits email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
