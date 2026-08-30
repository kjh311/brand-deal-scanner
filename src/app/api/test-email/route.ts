import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const data = await resend.emails.send({
      from: 'Brand Deal Fixer <notifications@send.branddealfixer.com>', // Use the sub-domain/domain verified in Resend
      to: ['kjh311@gmail.com'],
      subject: 'Welcome to Brand Deal Fixer!',
      html: '<h1>Welcome aboard!</h1><p>Your account is ready.</p>',
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
