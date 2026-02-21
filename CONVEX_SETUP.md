# Convex + Google Auth + PayPal Setup

## 1. Initialize Convex Project

```bash
cd /Volumes/Fast\ Storage/00-Organized/Work/Neo\ AI/neo_code_repos/calaba-sig-raffle
npx convex dev
```

When prompted:
- Select "Create a new project"
- Name it: `calaba-sig-raffle`

This will create `.env.local` with `NEXT_PUBLIC_CONVEX_URL`.

## 2. Set Up Google OAuth (for Admin)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://<your-convex-url>.convex.site/api/auth/callback/google`
4. Copy Client ID and Client Secret

## 3. Configure Convex Environment Variables

```bash
npx convex env set AUTH_GOOGLE_ID "your-client-id.apps.googleusercontent.com"
npx convex env set AUTH_GOOGLE_SECRET "your-client-secret"
npx convex env set WEBHOOK_MUTATION_SECRET "$(openssl rand -hex 32)"
```

## 4. PayPal Setup

1. Go to [PayPal Developer](https://developer.paypal.com/dashboard/applications)
2. Create/select your app
3. Copy Client ID (for frontend) and Secret (for webhooks)
4. Set up webhook:
   - URL: `https://calaba-sig-raffle.vercel.app/api/paypal-webhook`
   - Events: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.COMPLETED`
5. Copy Webhook ID

Add to `.env.local`:
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-secret
PAYPAL_WEBHOOK_ID=your-webhook-id
```

## 5. Deploy to Convex

```bash
npx convex deploy
```

## 6. Deploy to Vercel

Add these environment variables in Vercel:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `WEBHOOK_MUTATION_SECRET` (same as Convex)

```bash
vercel --prod
```

## Admin Access

- URL: https://calaba-sig-raffle.vercel.app/admin
- Login: Google (robspain@gmail.com only)
- Features:
  - 📊 Dashboard: Real-time stats, purchase history
  - 🎰 Live Drawing: Animated prize drawing for CalABA
  - 🎫 Tickets: View all sold tickets

## Live Drawing Feature

The `/admin` page includes a slot-machine style drawing animation:
1. Go to "Live Drawing" tab
2. Each draw shows the current prize
3. Click "DRAW WINNER" to spin
4. Winners are recorded and displayed
5. Ticket numbers can only win once
