import { NextRequest, NextResponse } from 'next/server';
import { sendZeroCreditsEmail } from '@/lib/emails/send-zero-credits';
import { sendPaymentFailedEmail } from '@/lib/emails/send-payment-failed';
import { sendCancellationEmail } from '@/lib/emails/send-cancellation';
import { sendSubscriptionEndedEmail } from '@/lib/emails/send-subscription-ended';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get('to') || 'kjh311@gmail.com';
    const type = searchParams.get('type') || 'payment-failed';

    let result: any = null;

    if (type === 'payment-failed') {
      console.log('[Test Email API] Testing payment failed email dispatch to:', to);
      result = await sendPaymentFailedEmail({
        email: to,
        amountDue: 2900,
        currency: 'usd',
        planName: 'Plus Plan',
        paymentUpdateUrl: 'https://www.branddealfixer.com/settings',
        nextPaymentAttempt: Math.floor(Date.now() / 1000) + 3 * 86400, // 3 days from now
      });
    } else if (type === 'cancellation') {
      console.log('[Test Email API] Testing cancellation email dispatch to:', to);
      result = await sendCancellationEmail({
        email: to,
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 14 * 86400,
        creditsRemaining: 3,
        nonExpiringCredits: 10,
      });
    } else if (type === 'ended') {
      console.log('[Test Email API] Testing subscription ended email dispatch to:', to);
      result = await sendSubscriptionEndedEmail({
        email: to,
        nonExpiringCredits: 10,
      });
    } else {
      console.log('[Test Email API] Testing zero credits email dispatch to:', to);
      result = await sendZeroCreditsEmail({ email: to });
    }

    return NextResponse.json({
      success: true,
      message: `Tested ${type} email dispatch to ${to}`,
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
