import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// PayPal API base URLs
const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

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

  const { 
    name, 
    email, 
    amount, 
    ticketCount, 
    ticketNumbers, 
    paypalOrderId, 
    paypalPayerId 
  } = req.body;

  // Validate required fields
  if (!name || !email || !amount || !ticketCount || !ticketNumbers || !paypalOrderId) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['name', 'email', 'amount', 'ticketCount', 'ticketNumbers', 'paypalOrderId']
    });
  }

  try {
    // Step 1: Verify PayPal order is actually completed
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET;

    if (!paypalClientId || !paypalSecret) {
      console.error('PayPal credentials not configured');
      // Store purchase anyway but mark as unverified
      const purchaseId = await storePurchase(name, email, amount, ticketCount, ticketNumbers, paypalOrderId, paypalPayerId, false);
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Purchase stored but PayPal verification unavailable',
        purchaseId,
        ticketNumbers
      });
    }

    // Get PayPal access token
    const authResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      throw new Error('PayPal authentication failed');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify order details
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.ok) {
      throw new Error('PayPal order verification failed');
    }

    const orderData = await orderResponse.json();

    // Check order status
    if (orderData.status !== 'COMPLETED' && orderData.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'PayPal order not completed',
        status: orderData.status
      });
    }

    // Verify amount matches
    const paypalAmount = parseFloat(orderData.purchase_units[0].amount.value);
    const expectedAmount = parseFloat(amount);
    
    if (Math.abs(paypalAmount - expectedAmount) > 0.01) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${paypalAmount}`);
      return res.status(400).json({
        error: 'Amount mismatch',
        expected: expectedAmount,
        received: paypalAmount
      });
    }

    // Step 2: Store purchase in Vercel KV
    const purchaseId = await storePurchase(name, email, amount, ticketCount, ticketNumbers, paypalOrderId, paypalPayerId, true);

    // Step 3: Send confirmation email
    try {
      await sendConfirmationEmail(name, email, ticketCount, amount, ticketNumbers);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Don't fail the purchase if email fails
    }

    return res.status(200).json({
      success: true,
      verified: true,
      purchaseId,
      ticketNumbers,
      paypalOrderId
    });

  } catch (error) {
    console.error('Error processing purchase:', error);
    return res.status(500).json({ 
      error: 'Failed to process purchase',
      detail: error.message 
    });
  }
}

async function storePurchase(name, email, amount, ticketCount, ticketNumbers, paypalOrderId, paypalPayerId, verified) {
  const purchaseId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const purchase = {
    purchaseId,
    name,
    email,
    amount: Math.round(parseFloat(amount) * 100), // Store in cents for consistency with Stripe
    ticketCount: parseInt(ticketCount),
    ticketNumbers: Array.isArray(ticketNumbers) ? ticketNumbers : [ticketNumbers],
    paypalOrderId,
    paypalPayerId: paypalPayerId || null,
    timestamp,
    verified,
    source: 'paypal'
  };

  try {
    // Store individual purchase
    await kv.set(`purchase:${purchaseId}`, JSON.stringify(purchase));
    
    // Add to purchases list
    await kv.lpush('purchases:list', purchaseId);

    console.log(`Purchase stored: ${purchaseId}`);
    return purchaseId;
  } catch (error) {
    console.error('KV storage failed:', error);
    // Fallback: just log it
    console.log('Purchase data (KV unavailable):', JSON.stringify(purchase));
    return purchaseId;
  }
}

async function sendConfirmationEmail(name, email, ticketCount, amount, ticketNumbers) {
  const ticketList = ticketNumbers.map(t => `<li style="font-family: monospace; font-size: 16px; color: #0891b2; font-weight: bold;">${t}</li>`).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0891b2 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Your CalABA Raffle Tickets</h1>
      <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Thank you for supporting CalABA!</p>
    </div>
    
    <!-- Content -->
    <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #1a1a1a;">Hi ${name},</p>
      
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #525252; line-height: 1.6;">
        Your payment has been confirmed! Here are your raffle ticket numbers for the <strong>CalABA 2026 Conference Raffle</strong>:
      </p>
      
      <!-- Ticket Numbers -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0891b2; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0891b2;">Your Ticket Numbers:</p>
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${ticketList}
        </ul>
      </div>
      
      <!-- Purchase Summary -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px; color: #525252;">
          <tr>
            <td style="padding: 8px 0;"><strong>Tickets Purchased:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${ticketCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 700;">$${parseFloat(amount).toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      <!-- Event Details -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #92400e; font-size: 14px;">Event Details:</p>
        <p style="margin: 0; font-size: 14px; color: #a16207; line-height: 1.6;">
          <strong>Date:</strong> Friday, March 6, 2026<br>
          <strong>Time:</strong> Drawings begin at 6:00 PM<br>
          <strong>Location:</strong> Room 8, Sacramento Convention Center
        </p>
      </div>
      
      <!-- Important Notice -->
      <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 15px; color: #991b1b; font-weight: 700; text-align: center;">
          You must be present at the event to win!
        </p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #b91c1c; text-align: center;">
          Winners will be drawn throughout the reception. Keep this email for your records.
        </p>
      </div>
      
      <p style="margin: 0; font-size: 14px; color: #737373; line-height: 1.6;">
        See you at CalABA 2026!<br>
        <em style="color: #0891b2;">- The CalABA SIG Team</em>
      </p>
      
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 24px; text-align: center; padding: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
        Questions? Contact <a href="mailto:bae.sig.calaba@behaviorschool.com" style="color: #0891b2; text-decoration: none;">bae.sig.calaba@behaviorschool.com</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
        <a href="https://calaba.org" style="color: #0891b2; text-decoration: none;">calaba.org</a>
      </p>
    </div>
    
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: 'CalABA SIG Raffle <bae.sig.calaba@behaviorschool.com>',
    to: email,
    subject: `Your CalABA Raffle Tickets - ${ticketNumbers[0]}${ticketCount > 1 ? ' +' + (ticketCount - 1) : ''}`,
    html: htmlContent
  });

  console.log(`Confirmation email sent to ${email}`);
}
