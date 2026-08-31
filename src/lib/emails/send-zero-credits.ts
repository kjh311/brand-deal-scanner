import { resend } from '../resend';

interface SendZeroCreditsEmailArgs {
  email: string;
}

export async function sendZeroCreditsEmail({ email }: SendZeroCreditsEmailArgs) {
  try {
    console.log('[Credit System] Zero balance reached for user:', email);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Out of Credits</title>
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
    .topup-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .topup-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #D84C9F;
      margin-bottom: 12px;
    }
    .topup-text {
      font-size: 14px;
      line-height: 22px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }
    .topup-highlight {
      font-weight: 700;
      color: #FFFFFF;
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
    .btn:hover {
      transform: scale(1.02);
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
        <h1>You've Used All Your Credits</h1>
        <p class="subtitle">Both your monthly and non-expiring credit balances have hit 0, meaning new contract scans and counter-offer generations are currently paused.</p>
      </div>

      <div class="topup-box">
        <div class="topup-title">Need More Scans?</div>
        <p class="topup-text">
          You can purchase <span class="topup-highlight">Credit Top-Up Packs</span> directly from your billing dashboard without upgrading your monthly plan. Top-up credits <span class="topup-highlight">never expire</span> and will stay on your account until you need them.
        </p>
      </div>

      <div class="btn-container">
        <a href="https://www.branddealfixer.com/dashboard/billing?topup=true" class="btn">Buy Credit Top-Ups</a>
      </div>

      <div class="sign-off">
        &mdash; The Brand Deal Fixer Team
      </div>

      <div class="footer">
        Have questions? Reply directly to this email to contact support.<br>
        &copy; ${new Date().getFullYear()} Brand Deal Fixer. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const data = await resend.emails.send({
      from: 'Brand Deal Fixer <support@send.branddealfixer.com>',
      to: [email],
      subject: 'You are out of credits — Brand Deal Fixer',
      html: htmlContent,
    });

    console.log('[Resend] Out-of-credits email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend] Failed to send out-of-credits email:', error.message || error);
    return { success: false, error: error.message };
  }
}
