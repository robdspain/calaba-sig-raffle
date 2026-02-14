# Quick Start Guide - CalABA Raffle PayPal Integration

## Status: DEPLOYED (Sandbox Mode)

✅ Code pushed to GitHub
✅ Vercel will auto-deploy
✅ Using PayPal sandbox mode (client-id: "sb")

## What You Need to Do NOW

### 1. Configure Environment Variables in Vercel

Go to: https://vercel.com/dashboard > Your Project > Settings > Environment Variables

Add these (for Production, Preview, and Development):

```
PAYPAL_CLIENT_ID=sb
PAYPAL_SECRET=<GET FROM LIZ>
PAYPAL_MODE=sandbox
RESEND_API_KEY=re_f4srKc4t_4rjpYf7do2quereTYzd19MkA
ADMIN_TOKEN=<CREATE A SECURE RANDOM STRING>
```

**Note:** PAYPAL_SECRET is pending from Liz. The integration will work but won't verify orders until this is set.

### 2. Generate ADMIN_TOKEN

Run this to generate a secure random token:
```bash
openssl rand -hex 32
```

Copy the output and paste it as ADMIN_TOKEN in Vercel.

### 3. Test the Site

1. Visit: https://calaba-sig-raffle.vercel.app
2. Enter name and email
3. Select a ticket package
4. Click the PayPal button
5. Complete sandbox payment (you'll need a PayPal sandbox account)
6. Verify ticket confirmation shows up

### 4. Test Admin Dashboard

1. Visit: https://calaba-sig-raffle.vercel.app/admin.html
2. Enter your ADMIN_TOKEN
3. Verify purchases show up
4. Test CSV export

## Before Going LIVE (Before Mar 1)

### Get from Liz:
- [ ] Live PayPal Client ID
- [ ] Live PayPal Secret

### Update in Vercel:
- [ ] PAYPAL_CLIENT_ID = <live client ID>
- [ ] PAYPAL_SECRET = <live secret>
- [ ] PAYPAL_MODE = live

### Update in Code:
- [ ] Edit index.html, line ~19:
  ```html
  <script src="https://www.paypal.com/sdk/js?client-id=LIVE_CLIENT_ID&currency=USD"></script>
  ```
- [ ] Commit and push to GitHub

### Final Test:
- [ ] Make a real $10 purchase
- [ ] Verify email arrives
- [ ] Check admin dashboard
- [ ] Refund test purchase (optional)

## Quick Troubleshooting

**PayPal buttons not showing?**
- Check browser console for errors
- Verify PayPal SDK loaded (check Network tab)
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Email not received?**
- Check spam folder
- Verify RESEND_API_KEY is correct in Vercel
- Check Vercel function logs for errors

**Purchase not in admin dashboard?**
- Verify ADMIN_TOKEN matches between dashboard and Vercel
- Check Vercel KV is connected to project
- Check browser console for errors

**"PayPal order not completed" error?**
- Payment may have failed
- Check PayPal sandbox dashboard
- Verify PAYPAL_SECRET is set correctly

## Important Files

- **index.html** - Main raffle page with PayPal integration
- **admin.html** - Admin dashboard for viewing purchases
- **api/confirm-purchase.js** - Backend verification and email
- **api/purchases.js** - GET endpoint for admin data
- **README.md** - Full documentation
- **DEPLOYMENT.md** - Complete deployment checklist
- **PAYPAL_INTEGRATION_SUMMARY.md** - What was built

## Support

- **Site/Code Issues**: Rob Spain (robspain@gmail.com)
- **PayPal Issues**: Liz or developer.paypal.com/support
- **Email Issues**: Resend dashboard or Rob

## Timeline

- **NOW - Feb 28**: Sandbox testing
- **Mar 1**: Switch to live PayPal
- **Mar 1-6**: Live ticket sales
- **Mar 6, 12 PM**: Online sales close
- **Mar 6, 6 PM**: Raffle drawings begin

---

**Everything is ready to test in sandbox mode. Just set the environment variables in Vercel and you're good to go!**
