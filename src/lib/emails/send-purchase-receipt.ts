import { resend, EMAIL_FROM } from '@/lib/resend';

export interface PurchaseReceiptParams {
  email: string;
  planName: string;
  amountPaid: number;
  hostedInvoiceUrl: string | null;
}

export async function sendPurchaseReceiptEmail({
  email,
  planName,
  amountPaid,
  hostedInvoiceUrl,
}: PurchaseReceiptParams) {
  console.log('[sendPurchaseReceiptEmail] Sending to:', email, '| From:', EMAIL_FROM);

  const data = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: 'Your Brand Deal Fixer Receipt & Subscription Confirmation',
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
                  Payment Received!
                </h1>
                <p style="margin: 0 0 16px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                  Thank you for your purchase. Your subscription to Brand Deal Fixer is now active, and you're ready to start analyzing your brand deal contracts with AI-powered precision.
                </p>

                <!-- Order Breakdown Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Plan</td>
                          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${planName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.1);">Amount Paid</td>
                          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.1);">$${(amountPaid / 100).toFixed(2)} USD</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                ${hostedInvoiceUrl ? `
                <!-- CTA Button -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${hostedInvoiceUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #1e1a5f; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 10px;">
                        View & Download Official Invoice
                      </a>
                    </td>
                  </tr>
                </table>
                ` : ''}

                <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px;">
                  — The Brand Deal Fixer Team
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  console.log('[sendPurchaseReceiptEmail] Resend success:', data);
  return data;
}
