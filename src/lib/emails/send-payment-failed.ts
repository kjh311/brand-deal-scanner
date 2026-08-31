import { resend, EMAIL_FROM } from '../resend';

interface SendPaymentFailedEmailArgs {
  email: string;
  amountDue: number; // in cents
  currency: string;
  billingPortalUrl: string;
}

export async function sendPaymentFailedEmail({
  email,
  amountDue,
  currency,
  billingPortalUrl,
}: SendPaymentFailedEmailArgs) {
  try {
    console.log('[Stripe Webhook] Processing failed payment notification for:', email);

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountDue / 100);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Unsuccessful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B0826;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0B0826;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #15123A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 40px;
      box-sizing: border-box;
      color: #FFFFFF;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #D84C9F;
      letter-spacing: -0.02em;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 12px 0;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      text-align: center;
    }
    .subtitle {
      font-size: 15px;
      line-height: 24px;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 32px 0;
      text-align: center;
    }
    .details-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .details-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #EF4444;
      margin-bottom: 16px;
    }
    .details-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    .details-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
    }
    .details-value {
      font-size: 18px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .warning-text {
      font-size: 13px;
      line-height: 20px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .btn-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .btn {
      background-color: #FFFFFF;
      color: #15123A;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 32px;
      border-radius: 12px;
      display: inline-block;
      transition: transform 0.15s;
    }
    .reassurance {
      font-size: 14px;
      line-height: 22px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 32px;
      text-align: center;
    }
    .sign-off {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      text-align: center;
      margin-bottom: 32px;
    }
    .footer {
      font-size: 13px;
      line-height: 20px;
      color: rgba(255, 255, 255, 0.4);
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 24px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">Brand Deal Fixer</span>
        <h1>Payment Unsuccessful</h1>
        <p class="subtitle">We were unable to process your recent subscription renewal payment.</p>
      </div>

      <div class="details-box">
        <div class="details-title">Transaction Details</div>
        <div class="details-item">
          <div class="details-label">Amount Due</div>
          <div class="details-value">${formattedAmount}</div>
        </div>
        <div class="warning-text">
          To prevent any interruption to your subscription benefits, please update your payment method. Unpaid plans may have their credit renewals paused.
        </div>
      </div>

      <div class="btn-container">
        <a href="${billingPortalUrl}" class="btn">Update Payment Method</a>
      </div>

      <p class="reassurance">Don't worry — your saved contract analysis history and account profile remain completely safe and will be waiting for you once your payment method is updated.</p>

      <div class="sign-off">
        &mdash; The Brand Deal Fixer Team
      </div>

      <div class="footer">
        Need help? Reply directly to this email to contact our support team.<br>
        &copy; ${new Date().getFullYear()} Brand Deal Fixer. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: 'Action Required: Payment Failed for Brand Deal Fixer',
      html: htmlContent,
    });

    console.log('[Resend] Payment failed email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend] Failed to send payment failed email:', error.message || error);
    return { success: false, error: error.message };
  }
}
