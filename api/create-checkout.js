import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { ticketCount, amount, customerName, customerEmail } = req.body;

  if (!ticketCount || !amount || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate amounts match expected pricing
  const validPrices = {
    1: 1000,  // $10 in cents
    3: 2000,  // $20 in cents
    7: 4000   // $40 in cents
  };

  const amountInCents = validPrices[ticketCount];
  if (!amountInCents) {
    return res.status(400).json({ error: 'Invalid ticket count' });
  }

  try {
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `CalABA 2026 Raffle Tickets (${ticketCount}x)`,
              description: `${ticketCount} raffle ticket${ticketCount > 1 ? 's' : ''} for CalABA 2026 Conference Raffle`,
              images: ['https://calaba-sig-raffle.vercel.app/calaba-logo.png'],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        ticketCount: ticketCount.toString(),
        customerName,
        customerEmail,
        purpose: 'raffle-tickets'
      },
      success_url: `${req.headers.origin || 'https://calaba-sig-raffle.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://calaba-sig-raffle.vercel.app'}/index.html?canceled=true`,
    });

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      detail: error.message 
    });
  }
}
