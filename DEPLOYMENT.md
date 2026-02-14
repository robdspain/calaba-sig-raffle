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

Add the following:

```
PAYPAL_CLIENT_ID=sb
```
(All environments - use "sb" for sandbox, will replace with live client ID from Liz)

```
PAYPAL_SECRET=your_paypal_secret
```
(All environments - get from Liz, pending)

```
PAYPAL_MODE=sandbox
```
(All environments - change to "live" when going live)

```
RESEND_API_KEY=re_f4srKc4t_4rjpYf7do2quereTYzd19MkA
```
(All environments)

```
ADMIN_TOKEN=calaba-admin-2026-secure-token
```
(Production only - for admin dashboard access, use a secure random string)

**Optional (legacy Stripe fallback):**
```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Update PayPal SDK Client ID in index.html

Before going live, update the PayPal script tag in `index.html`:

```html
<!-- Change from: -->
<script src="https://www.paypal.com/sdk/js?client-id=sb&currency=USD"></script>

<!-- To: -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_LIVE_CLIENT_ID&currency=USD"></script>
```

Then commit and push to trigger auto-deployment.

### 4. (Optional) Stripe Webhook Configuration

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

### 5. Test the Integration

#### Test PayPal Checkout (Sandbox Mode)
1. Go to https://calaba-sig-raffle.vercel.app
2. Enter name and email
3. Click on a ticket package (e.g., $10 for 1 ticket)
4. PayPal smart buttons should appear
5. Click the PayPal button
6. Log in with PayPal sandbox account (create one at developer.paypal.com if needed)
7. Complete the payment
8. Verify:
   - Payment processing message appears
   - Ticket confirmation shows with ticket numbers (CALABA-XXXXX format)
   - Received email with ticket numbers
   - Purchase appears in admin dashboard
   - Progress bar updates

#### Test Admin Dashboard
1. Go to https://calaba-sig-raffle.vercel.app/admin.html
2. Enter your admin token (from ADMIN_TOKEN env var)
3. Click "Authenticate"
4. Verify:
   - Stats show total revenue, tickets, purchases
   - Purchase table shows all transactions with PayPal order IDs
   - Search works
   - CSV export works
   - Ticket badge clicks open winner modal

#### Test Backend Verification
1. Make a test purchase
2. Check Vercel function logs for `/api/confirm-purchase`
3. Verify logs show:
   - PayPal order verification succeeded
   - Purchase stored in KV
   - Confirmation email sent

### 6. Go Live

Once testing is complete:

1. Get **LIVE PayPal credentials** from Liz:
   - Live Client ID
   - Live Secret

2. Update Vercel environment variables:
   - `PAYPAL_CLIENT_ID` = live client ID
   - `PAYPAL_SECRET` = live secret  
   - `PAYPAL_MODE` = "live"

3. Update `index.html` PayPal SDK script tag:
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=LIVE_CLIENT_ID&currency=USD"></script>
   ```

4. Commit and push to GitHub:
   ```bash
   git add index.html
   git commit -m "Switch to live PayPal client ID"
   git push
   ```

5. Vercel will auto-deploy

6. Final verification:
   - Make a real $10 test purchase with your own PayPal
   - Verify email receipt
   - Check admin dashboard
   - Refund the test purchase in PayPal if desired

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

### PayPal buttons not showing
- Check browser console for JavaScript errors
- Verify PayPal SDK script is loaded (check Network tab)
- Ensure `client-id` in script tag is set (even if just "sb" for sandbox)
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### PayPal payment completes but no ticket generated
- Check Vercel function logs for `/api/confirm-purchase` errors
- Verify `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` are set correctly
- Check if PayPal order verification failed (wrong credentials or mode mismatch)
- Verify KV storage is working

### "PayPal order not completed" error
- Payment may not have fully processed
- Check PayPal sandbox/live dashboard for order status
- Try the purchase again
- If issue persists, contact PayPal support

### Emails not sending
- Verify `RESEND_API_KEY` is correct: `re_f4srKc4t_4rjpYf7do2quereTYzd19MkA`
- Check Resend dashboard for bounce/error logs
- Verify sender email is verified in Resend: `bae.sig.calaba@behaviorschool.com`
- Email failures won't block purchase - ticket still generated

### KV storage errors
- Verify Vercel KV is connected to project
- Check Vercel KV dashboard for connection issues
- Environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` should be auto-set
- Purchases will still log to console if KV fails

### Admin dashboard won't load purchases
- Verify admin token is correct: check Vercel env var `ADMIN_TOKEN`
- Check browser console for errors
- Verify `/api/purchases` endpoint is working (test with `?summary=true`)
- Try clearing browser cache

## Support Contacts

- **PayPal Issues**: Contact Liz or developer.paypal.com/support
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
  1. PayPal transaction history
  2. Resend email logs
  3. CSV backups

## Security Notes

- Admin token provides full access - keep confidential
- PayPal Client ID is public, but Secret must be kept secure - never commit to git
- Resend API key allows sending emails - protect carefully
- All sensitive keys stored in Vercel environment variables only
- PayPal order verification prevents fake purchases (backend validates with PayPal API)

## Timeline

- **Now - Feb 28**: Test mode, accepting test purchases
- **Mar 1 - 5**: Live mode, accepting real purchases
- **Mar 6, 12 PM**: Online sales close
- **Mar 6, 6 PM**: Prize drawings begin

## Success Criteria

- [ ] All environment variables configured (PayPal, Resend, Admin token)
- [ ] PayPal smart buttons rendering on index.html
- [ ] PayPal sandbox test purchase completes successfully
- [ ] Ticket numbers generated in CALABA-XXXXX format
- [ ] Confirmation emails sending successfully via Resend
- [ ] Purchases storing in Vercel KV
- [ ] Admin dashboard accessible with correct token
- [ ] Admin dashboard shows all purchases with correct data
- [ ] Progress bar updating in real-time
- [ ] CSV export working
- [ ] Live PayPal credentials obtained from Liz
- [ ] Live mode activated and tested with real $10 purchase
