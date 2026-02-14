# CalABA 2026 Conference Raffle

Complete PayPal-integrated raffle ticket system for the CalABA 2026 Conference.

## Live Site
https://calaba-sig-raffle.vercel.app

## Features

- **PayPal Checkout Integration**: Secure payments via PayPal JavaScript SDK
- **3 Ticket Packages**: $10 (1 ticket), $20 (3 tickets), $40 (7 tickets)
- **Automated Ticket Generation**: Unique CALABA-XXXXX format (5 random digits)
- **Email Confirmations**: Automatic ticket delivery via Resend API
- **Payment Verification**: Backend verifies PayPal orders before issuing tickets
- **Admin Dashboard**: Purchase tracking, winner selection, CSV export
- **Real-time Progress**: Live fundraising progress bar
- **Centralized Storage**: Vercel KV for purchase data

## Tech Stack

- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Payment**: PayPal JavaScript SDK (with Stripe as legacy fallback)
- **Email**: Resend API
- **Storage**: Vercel KV (Redis-compatible)
- **Hosting**: Vercel (auto-deploy from GitHub)

## Setup

### 1. Environment Variables

Configure these in Vercel Dashboard (Settings > Environment Variables):

```
# PayPal (primary payment method)
PAYPAL_CLIENT_ID=<from Liz, pending - use "sb" for sandbox testing>
PAYPAL_SECRET=<from Liz, pending>
PAYPAL_MODE=sandbox (or "live" for production)

# Email confirmations
RESEND_API_KEY=re_f4srKc4t_4rjpYf7do2quereTYzd19MkA

# Admin dashboard
ADMIN_TOKEN=<generate a secure random token>

# Legacy Stripe (optional - can be removed)
STRIPE_SECRET_KEY=sk_live_xxxxx (optional - Stripe checkout still available as fallback)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (optional)
```

**Note:** Contact Liz for PayPal credentials. Use sandbox mode until live credentials are available.

Vercel KV variables are auto-configured when you add the KV integration.

### 2. Switching from Sandbox to Live PayPal

**Currently using:** Sandbox mode with test client-id "sb"

**To go live:**
1. Get live PayPal Client ID and Secret from Liz
2. Update environment variables in Vercel:
   - `PAYPAL_CLIENT_ID` = live client ID
   - `PAYPAL_SECRET` = live secret
   - `PAYPAL_MODE` = "live"
3. Update index.html PayPal SDK script tag:
   - Change `client-id=sb` to `client-id=YOUR_LIVE_CLIENT_ID`
4. Redeploy (auto-deploy on git push)

**No code changes needed** - just update env vars and the SDK script tag!

### 3. Vercel KV Setup

1. Go to Vercel Dashboard > Storage > Create Database
2. Select "KV" (Redis-compatible key-value store)
3. Name it "calaba-raffle-kv"
4. Connect to your project
5. Environment variables will be auto-configured

### 4. (Optional) Stripe Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://calaba-sig-raffle.vercel.app/api/stripe-webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret
5. Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

### 4. Deploy

Push to GitHub - Vercel auto-deploys:

```bash
git add .
git commit -m "Add Stripe integration"
git push origin main
```

## API Endpoints

### `/api/confirm-purchase` (POST)
**Primary endpoint** - Confirm PayPal purchase, verify order, and send confirmation.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "amount": 40,
  "ticketCount": 7,
  "ticketNumbers": ["CALABA-12345", "CALABA-67890", ...],
  "paypalOrderId": "8AB12345CD678901E",
  "paypalPayerId": "PAYERID123"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "purchaseId": "pp_1234567890_abc123",
  "ticketNumbers": ["CALABA-12345", ...],
  "paypalOrderId": "8AB12345CD678901E"
}
```

**What it does:**
- Verifies PayPal order is completed via PayPal API
- Validates payment amount matches ticket price
- Stores purchase in Vercel KV
- Sends confirmation email via Resend with ticket numbers

### `/api/create-checkout` (POST)
**Legacy Stripe endpoint** - Create Stripe Checkout session (optional fallback)

### `/api/stripe-webhook` (POST)
**Legacy Stripe webhook** - Handles Stripe checkout.session.completed events

### `/api/purchases` (GET)
Get purchase data

**Public (no auth):**
`GET /api/purchases?summary=true`

Returns:
```json
{
  "summary": {
    "totalRevenue": 240.00,
    "totalTickets": 18,
    "totalPurchases": 3
  }
}
```

**Admin (requires Bearer token):**
`GET /api/purchases`
`Authorization: Bearer your-admin-token`

Returns full purchase details.

## Admin Dashboard

Access at: `/admin.html`

**Features:**
- View all purchases
- See total revenue and tickets sold
- Search by name, email, or ticket number
- Export CSV
- Mark winners and assign prizes
- Winner data stored in browser localStorage

**Admin Token:** Set via ADMIN_TOKEN env var in Vercel (contact Rob for the token)

## Brand Colors

- Chalkboard Green: #1E3A34
- Vintage Gold: #E3B23C
- Cream: #FAF3E0

## Event Details

- **Date**: Friday, March 6, 2026
- **Time**: 5:00 PM - 8:00 PM
- **Location**: Room 8, Sacramento Convention Center
- **Drawings**: Begin at 6:00 PM
- **Important**: Must be present to win

## Ticket Format

Tickets use format: `CALABA-XXXXX`
- 5 random alphanumeric characters
- Excludes confusing characters (0, O, 1, I, etc.)
- Unique validation against Vercel KV

## Email Template

Confirmation emails include:
- Ticket numbers
- Purchase summary
- Event details
- CalABA branding
- "Must be present to win" notice

## Testing

### Test Stripe Integration:

Use Stripe test mode:
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Test Webhook:

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```

## Support

Questions: bae.sig.calaba@behaviorschool.com

## License

Proprietary - CalABA 2026 Conference
