export type CheckoutMode = 'payment' | 'subscription';

export async function handleCheckout(priceId: string, mode: CheckoutMode = 'subscription', credits: number = 0) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, mode, credits }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    if (data.url) {
      // Redirect to the Stripe-hosted checkout page
      window.location.assign(data.url);
    }
  } catch (err) {
    console.error('Checkout error:', err);
    alert(err instanceof Error ? err.message : 'Something went wrong');
  }
}
