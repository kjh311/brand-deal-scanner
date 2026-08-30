import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = 'Brand Deal Fixer <support@branddealfixer.com>';

export interface WelcomeEmailParams {
  email: string;
  name?: string | null;
}

export async function sendWelcomeEmail({ email, name }: WelcomeEmailParams) {
  console.log('[sendWelcomeEmail] Sending to:', email, '| From:', EMAIL_FROM);

  const data = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: 'Welcome to Brand Deal Fixer!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; padding: 0 20px;">
            <tr>
              <td style="background-color: #1e1a5f; border-radius: 16px; padding: 48px 40px;">
                <h1 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">
                  Welcome to Brand Deal Fixer!
                </h1>
                <p style="margin: 0 0 16px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                  Hi ${name || 'there'},
                </p>
                <p style="margin: 0 0 16px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                  Brand Deal Fixer is ready to help you analyze and streamline your brand deal contracts. Our AI-powered engine scans for predatory clauses, identifies missing protections, and generates professional counter-offers — all in seconds.
                </p>
                <p style="margin: 0 0 32px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                  Have questions or need help? Simply reply directly to this email and our support team will assist you.
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                  — The Brand Deal Fixer Team
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  console.log('[sendWelcomeEmail] Resend success:', data);
  return data;
}
