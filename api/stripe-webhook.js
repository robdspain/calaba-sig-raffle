import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate unique ticket number in CALABA-XXXXX format
function generateTicketNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let result = 'CALABA-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique ticket numbers (check for duplicates in KV)
async function generateUniqueTicketNumbers(count) {
  const tickets = [];
  const maxAttempts = count * 10; // Prevent infinite loop
  let attempts = 0;

  while (tickets.length < count && attempts < maxAttempts) {
    const ticket = generateTicketNumber();
    
    // Check if ticket already exists
    const existing = await kv.get(`ticket:${ticket}`);
    if (!existing && !tickets.includes(ticket)) {
      tickets.push(ticket);
    }
    attempts++;
  }

  if (tickets.length < count) {
    throw new Error('Failed to generate unique ticket numbers');
  }

  return tickets;
}

// Send confirmation email via Resend
async function sendTicketEmail(purchase) {
  const ticketListHtml = purchase.ticketNumbers.map(num => 
    `<div style="background: #1E3A34; color: #E3B23C; padding: 12px; border-radius: 6px; margin: 8px 0; font-family: monospace; font-size: 16px; font-weight: 700; text-align: center; border: 2px solid #E3B23C;">${num}</div>`
  ).join('');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background: #FAF3E0;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1E3A34 0%, #0c4a6e 100%); padding: 40px 24px; text-align: center;">
      <div style="color: #E3B23C; font-size: 14px; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px;">CALABA 2026 CONFERENCE</div>
      <h1 style="color: white; font-size: 32px; margin: 0; font-weight: 800;">Your Raffle Tickets</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 24px;">
      <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 16px;">Hi ${purchase.name},</p>
      
      <p style="font-size: 16px; color: #525252; line-height: 1.6; margin: 0 0 24px;">
        Thank you for supporting CalABA! Your payment has been received and your raffle tickets are confirmed.
      </p>

      <!-- Purchase Summary -->
      <div style="background: #FAF3E0; border: 2px solid #E3B23C; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Tickets Purchased</div>
          <div style="font-size: 28px; font-weight: 800; color: #1E3A34;">${purchase.ticketCount} Ticket${purchase.ticketCount > 1 ? 's' : ''}</div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Amount Paid</div>
          <div style="font-size: 24px; font-weight: 700; color: #10b981;">$${(purchase.amount / 100).toFixed(2)}</div>
        </div>

        <div>
          <div style="font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Ticket Number${purchase.ticketCount > 1 ? 's' : ''}</div>
          ${ticketListHtml}
        </div>
      </div>

      <!-- Event Details -->
      <div style="background: #1E3A34; color: white; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h2 style="color: #E3B23C; font-size: 18px; margin: 0 0 16px; font-weight: 700;">Event Details</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
          <div>
            <div style="color: #E3B23C; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Date</div>
            <div style="font-weight: 600;">Friday, March 6, 2026</div>
          </div>
          <div>
            <div style="color: #E3B23C; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Time</div>
            <div style="font-weight: 600;">5:00 PM - 8:00 PM</div>
          </div>
          <div>
            <div style="color: #E3B23C; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Location</div>
            <div style="font-weight: 600;">Room 8</div>
          </div>
          <div>
            <div style="color: #E3B23C; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Drawings Begin</div>
            <div style="font-weight: 600;">6:00 PM</div>
          </div>
        </div>
      </div>

      <!-- Important Notice -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0;">
        <div style="font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 8px;">IMPORTANT: You Must Be Present to Win</div>
        <div style="font-size: 14px; color: #a16207; line-height: 1.6;">
          Winners will be drawn throughout the reception starting at 6:00 PM. You must be present in Room 8 during the drawings to claim your prize.
        </div>
      </div>

      <p style="font-size: 14px; color: #525252; line-height: 1.6;">
        Save this email as your receipt. If you have any questions, please contact us at 
        <a href="mailto:bae.sig.calaba@behaviorschool.com" style="color: #0891b2; text-decoration: none;">bae.sig.calaba@behaviorschool.com</a>
      </p>

      <p style="font-size: 14px; color: #525252; margin-top: 24px;">
        Thank you for supporting CalABA!<br>
        <strong>CalABA BAE SIG</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #1E3A34; padding: 24px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6);">
        CalABA 2026 Conference<br>
        March 5-7, 2026 • Sacramento Convention Center<br>
        <a href="https://calaba.org" style="color: #E3B23C; text-decoration: none;">calaba.org</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'BAE SIG CalABA <bae.sig.calaba@behaviorschool.com>',
      to: [purchase.email],
      subject: `Your CalABA 2026 Raffle Tickets - ${purchase.ticketNumbers.join(', ')}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  // Get raw body for signature verification
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const ticketCount = parseInt(session.metadata.ticketCount);
      const customerName = session.metadata.customerName;
      const customerEmail = session.metadata.customerEmail || session.customer_email;
      const amountPaid = session.amount_total; // in cents
      const paymentId = session.payment_intent;

      // Generate unique ticket numbers
      const ticketNumbers = await generateUniqueTicketNumbers(ticketCount);

      // Create purchase record
      const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const purchase = {
        id: purchaseId,
        name: customerName,
        email: customerEmail,
        amount: amountPaid,
        ticketCount,
        ticketNumbers,
        timestamp: new Date().toISOString(),
        stripePaymentId: paymentId,
        stripeSessionId: session.id,
        status: 'completed'
      };

      // Store purchase in Vercel KV
      await kv.set(`purchase:${purchaseId}`, JSON.stringify(purchase));
      
      // Add to purchases list
      await kv.lpush('purchases:list', purchaseId);

      // Store each ticket number mapping to purchase
      for (const ticketNum of ticketNumbers) {
        await kv.set(`ticket:${ticketNum}`, purchaseId);
      }

      // Send confirmation email
      const emailSent = await sendTicketEmail(purchase);

      console.log('Purchase processed:', {
        purchaseId,
        customerName,
        ticketCount,
        ticketNumbers,
        emailSent
      });

      return res.status(200).json({ 
        received: true, 
        purchaseId,
        emailSent
      });

    } catch (error) {
      console.error('Error processing purchase:', error);
      return res.status(500).json({ 
        error: 'Failed to process purchase',
        detail: error.message 
      });
    }
  }

  // Return 200 for other event types
  return res.status(200).json({ received: true });
}
