import { NextResponse } from 'next/server';
import { sendZeroCreditsEmail } from '@/lib/emails/send-zero-credits';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const expectedToken = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const data = await sendZeroCreditsEmail({ email });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Send Zero Credits API] Error:', error.message || error);
    const message = error instanceof Error ? error.message : 'Failed to send zero credits email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
