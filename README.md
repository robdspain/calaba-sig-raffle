# CalABA 2026 Conference Raffle

Complete Stripe-integrated raffle ticket system for the CalABA 2026 Conference.

## Live Site
https://calaba-sig-raffle.vercel.app

## Features

- **Stripe Checkout Integration**: Secure card payments for raffle tickets
- **3 Ticket Packages**: $10 (1 ticket), $20 (3 tickets), $40 (7 tickets)
- **Automated Ticket Generation**: Unique CALABA-XXXXX format ticket numbers
- **Email Confirmations**: Automatic ticket delivery via Resend API
- **PayPal Fallback**: Alternative payment option
- **Admin Dashboard**: Purchase tracking, winner selection, CSV export
- **Real-time Progress**: Live fundraising progress bar
- **Centralized Storage**: Vercel KV for purchase data

## Tech Stack

- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Vercel Serverless Functions
- **Payment**: Stripe Checkout + PayPal
- **Email**: Resend API
- **Storage**: Vercel KV
- **Hosting**: Vercel (auto-deploy from GitHub)

## Setup

### 1. Environment Variables

Configure these in Vercel Dashboard (Settings > Environment Variables):

```
STRIPE_SECRET_KEY=sk_live_xxxxx (get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (get from Stripe Dashboard after setting up webhook)
RESEND_API_KEY=re_xxxxx (get from Resend Dashboard)
ADMIN_TOKEN=your-custom-admin-token
```

**Note:** Contact Rob Spain for the actual API keys.

Vercel KV variables are auto-configured when you add the KV integration.

### 2. Vercel KV Setup

1. Go to Vercel Dashboard > Storage > Create Database
2. Select "KV" (Redis-compatible key-value store)
3. Name it "calaba-raffle-kv"
4. Connect to your project
5. Environment variables will be auto-configured

### 3. Stripe Webhook Setup

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

### `/api/create-checkout` (POST)
Create Stripe Checkout session

**Request:**
```json
{
  "ticketCount": 7,
  "amount": 40,
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/..."
}
```

### `/api/stripe-webhook` (POST)
Webhook handler for Stripe events. Automatically:
- Generates unique ticket numbers
- Stores purchase in Vercel KV
- Sends confirmation email via Resend

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
