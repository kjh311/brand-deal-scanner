import { resend, EMAIL_FROM } from '../resend'

interface SendPasswordResetEmailArgs {
  email: string
  resetLink: string
}

export async function sendPasswordResetEmail({ email, resetLink }: SendPasswordResetEmailArgs) {
  try {
    console.log('[Resend] Sending password reset email to:', email, '| From:', EMAIL_FROM)

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
      padding: 16px 36px;
      border-radius: 12px;
      display: inline-block;
      box-shadow: 0 4px 14px rgba(216, 76, 159, 0.4);
    }
    .disclaimer {
      font-size: 13px;
      line-height: 20px;
      color: rgba(255, 255, 255, 0.5);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 24px;
      margin-top: 32px;
    }
    .disclaimer a {
      color: #D84C9F;
      word-break: break-all;
    }
    .footer {
      font-size: 13px;
      line-height: 20px;
      color: rgba(255, 255, 255, 0.4);
      text-align: center;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">Brand Deal Fixer</span>
        <h1>Reset Your Password</h1>
        <p class="subtitle">We received a request to reset your password. Click the button below to set a new password for your account.</p>
      </div>

      <div class="btn-container">
        <a href="${resetLink}" target="_blank" class="btn">Reset Password</a>
      </div>

      <div class="disclaimer">
        <p style="margin: 0 0 12px 0;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p style="margin: 0;">Link not working? Copy and paste this URL into your browser:<br>
        <a href="${resetLink}">${resetLink}</a></p>
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Brand Deal Fixer. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
    `

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: 'Reset Your Password — Brand Deal Fixer',
      html: htmlContent,
    })

    console.log('[Resend] Password reset email sent successfully:', data)
    return { success: true, data }
  } catch (error: any) {
    console.error('[Resend] Failed to send password reset email:', error.message || error)
    return { success: false, error: error.message }
  }
}
