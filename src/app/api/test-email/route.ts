import { NextRequest, NextResponse } from 'next/server';
import { sendZeroCreditsEmail } from '@/lib/emails/send-zero-credits';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get('to') || 'kjh311@gmail.com';

    console.log('[Test Email API] Testing zero credits email dispatch to:', to);
    const result = await sendZeroCreditsEmail({ email: to });

    return NextResponse.json({
      success: true,
      message: `Tested zero credits email dispatch to ${to}`,
      result,
      env: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM || 'Brand Deal Fixer <support@branddealfixer.com>',
      }
    });
  } catch (error: any) {
    console.error('[Test Email API] Failure:', error);
    return NextResponse.json({
      success: false,
      error: error.message || error,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
