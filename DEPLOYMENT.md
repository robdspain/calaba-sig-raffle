# Deployment Checklist

## Pre-Deployment Steps

### 1. Vercel KV Setup
- [ ] Go to Vercel Dashboard > Storage
- [ ] Click "Create Database"
- [ ] Select "KV" (Redis-compatible key-value store)
- [ ] Name: `calaba-raffle-kv`
- [ ] Click "Create & Connect"
- [ ] Select your project: `calaba-sig-raffle`
- [ ] Environment variables will be auto-configured

### 2. Configure Environment Variables

Go to Vercel Dashboard > Settings > Environment Variables

Add the following (contact Rob Spain for actual values):

```
STRIPE_SECRET_KEY=sk_live_xxxxx_get_from_stripe_dashboard
```
(Production, Preview, Development)

```
RESEND_API_KEY=re_xxxxx_get_from_resend_dashboard
```
(Production, Preview, Development)

```
ADMIN_TOKEN=your_custom_admin_token
```
(Production only - for admin dashboard access)

**STRIPE_WEBHOOK_SECRET will be added after webhook setup (see step 3)**

### 3. Stripe Webhook Configuration

After the site deploys to Vercel:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to: Developers > Webhooks
3. Click "Add endpoint"
4. Endpoint URL: `https://calaba-sig-raffle.vercel.app/api/stripe-webhook`
5. Description: "CalABA Raffle Purchase Webhook"
6. Events to send: Select `checkout.session.completed`
7. Click "Add endpoint"
8. Click "Reveal" next to "Signing secret"
9. Copy the webhook secret (starts with `whsec_`)
10. Add to Vercel Environment Variables:
    ```
    STRIPE_WEBHOOK_SECRET=whsec_xxxxx
    ```
    (Production, Preview, Development)
11. Redeploy the site for the new env var to take effect

### 4. Test the Integration

#### Test Stripe Checkout (Production)
1. Go to https://calaba-sig-raffle.vercel.app
2. Enter name and email
3. Click on a ticket package
4. Click "Buy Tickets with Card (Stripe)"
5. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. Complete checkout
7. Verify:
   - Redirected to success page
   - Received email with ticket numbers
   - Purchase appears in admin dashboard

#### Test Admin Dashboard
1. Go to https://calaba-sig-raffle.vercel.app/admin.html
2. Enter your admin token (from ADMIN_TOKEN env var)
3. Click "Authenticate"
4. Verify:
   - Stats show total revenue, tickets, purchases
   - Purchase table shows all transactions
   - Search works
   - CSV export works
   - Ticket badge clicks open winner modal

#### Test Webhook
1. In Stripe Dashboard > Webhooks, click on the webhook endpoint
2. Click "Send test webhook"
3. Select `checkout.session.completed`
4. Click "Send test event"
5. Check Vercel logs for webhook processing

### 5. Go Live

Once testing is complete:

1. Switch Stripe to **LIVE MODE**:
   - In Stripe Dashboard, toggle from "Test mode" to "Live mode"
   - Update `STRIPE_SECRET_KEY` in Vercel with LIVE key
   
2. Update webhook for live mode:
   - Create new webhook endpoint in LIVE mode
   - Same URL: `https://calaba-sig-raffle.vercel.app/api/stripe-webhook`
   - Get new signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel

3. Redeploy in Vercel

4. Final verification:
   - Make a real $10 test purchase
   - Verify email receipt
   - Check admin dashboard
   - Refund the test purchase in Stripe

## Post-Deployment Monitoring

### Daily Checks
- Monitor Stripe Dashboard for new purchases
- Check Vercel logs for any errors
- Verify email delivery in Resend dashboard

### Weekly Tasks
- Review purchase data in admin dashboard
- Export CSV backup
- Verify total revenue matches Stripe

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct in Stripe
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Vercel function logs for errors
- Test webhook using Stripe CLI: `stripe trigger checkout.session.completed`

### Emails not sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for bounce/error logs
- Verify sender email is verified in Resend: `bae.sig.calaba@behaviorschool.com`

### KV storage errors
- Verify Vercel KV is connected to project
- Check Vercel KV dashboard for connection issues
- Environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` should be auto-set

### Admin dashboard won't load purchases
- Verify admin token is correct
- Check browser console for errors
- Verify `/api/purchases` endpoint is working (test with `?summary=true`)

## Support Contacts

- **Stripe Issues**: support@stripe.com
- **Vercel Issues**: support@vercel.com
- **Resend Issues**: support@resend.com
- **Site Issues**: Rob Spain (robspain@gmail.com)

## Backup & Recovery

### Data Backup
- Purchase data is stored in Vercel KV
- Winner selections stored in browser localStorage (export CSV regularly)
- Regular CSV exports recommended (weekly)

### Recovery
- If KV data is lost, purchases can be reconstructed from:
  1. Stripe payment history
  2. Resend email logs
  3. CSV backups

## Security Notes

- Admin token provides full access - keep confidential
- Stripe keys are sensitive - never commit to git
- Resend API key allows sending emails - protect carefully
- Webhook secret validates Stripe events - required for security
- All sensitive keys stored in Vercel environment variables only

## Timeline

- **Now - Feb 28**: Test mode, accepting test purchases
- **Mar 1 - 5**: Live mode, accepting real purchases
- **Mar 6, 12 PM**: Online sales close
- **Mar 6, 6 PM**: Prize drawings begin

## Success Criteria

- [ ] All environment variables configured
- [ ] Stripe webhook working
- [ ] Emails sending successfully  
- [ ] Admin dashboard accessible
- [ ] Purchase data storing correctly
- [ ] Progress bar updating in real-time
- [ ] Test purchase completed successfully
- [ ] Live mode activated and tested
