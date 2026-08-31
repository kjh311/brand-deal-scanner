import { resend, EMAIL_FROM } from '../resend';

interface SendCancellationEmailArgs {
  email: string;
  currentPeriodEnd: number; // Unix timestamp
  creditsRemaining: number;
  nonExpiringCredits: number;
}

export async function sendCancellationEmail({
  email,
  currentPeriodEnd,
  creditsRemaining,
  nonExpiringCredits,
}: SendCancellationEmailArgs) {
  try {
    console.log('[Stripe Webhook] Processing cancellation email for:', email);

    // Format the date: MMM DD, YYYY
    const endDate = new Date(currentPeriodEnd * 1000);
    const formattedDate = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subscription Canceled</title>
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
    .credit-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .credit-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #D84C9F;
      margin-bottom: 16px;
    }
    .credit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    .credit-item:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .credit-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
    }
    .credit-label p {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.45);
      margin: 4px 0 0 0;
    }
    .credit-value {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .btn-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .btn {
      background-color: #D84C9F;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 32px;
      border-radius: 12px;
      display: inline-block;
      transition: transform 0.15s;
    }
    .footer {
      font-size: 13px;
      line-height: 20px;
      color: rgba(255, 255, 255, 0.4);
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 24px;
    }
    .footer a {
      color: #D84C9F;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">Brand Deal Fixer</span>
        <h1>Subscription Canceled</h1>
        <p class="subtitle">Confirming your paid subscription has been canceled. You will continue to have access to your plan benefits until <strong>${formattedDate}</strong>.</p>
      </div>

      <div class="credit-box">
        <div class="credit-title">Current Credit Status</div>
        
        <div class="credit-item">
          <div class="credit-label">
            Monthly Credits
            <p>Expires on ${formattedDate}</p>
          </div>
          <div class="credit-value">${creditsRemaining}</div>
        </div>

        <div class="credit-item">
          <div class="credit-label">
            Non-Expiring Credits
            <p>Kept indefinitely on your account</p>
          </div>
          <div class="credit-value">${nonExpiringCredits}</div>
        </div>
      </div>

      <div class="btn-container">
        <a href="https://www.branddealfixer.com/dashboard/billing" class="btn">Reactivate Subscription</a>
      </div>

      <div class="footer">
        Questions or feedback? Simply reply directly to this email.<br>
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
      subject: 'Subscription Canceled — Brand Deal Fixer',
      html: htmlContent,
    });

    console.log('[Resend] Cancellation email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend] Failed to send cancellation email:', error.message || error);
    // Return success: false instead of throwing to prevent crashing the webhook response
    return { success: false, error: error.message };
  }
}
