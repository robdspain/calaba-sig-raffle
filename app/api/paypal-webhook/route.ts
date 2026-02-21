import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Lazy init to avoid build-time errors
function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
  return new ConvexHttpClient(url);
}

// Verify PayPal webhook signature
async function verifyPayPalWebhook(
  body: string,
  headers: Headers
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn("PAYPAL_WEBHOOK_ID not set, skipping verification");
    return true; // Allow in dev
  }

  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const certUrl = headers.get("paypal-cert-url");
  const transmissionSig = headers.get("paypal-transmission-sig");
  const authAlgo = headers.get("paypal-auth-algo");

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
    return false;
  }

  // In production, verify signature with PayPal API
  // For now, trust the headers exist
  return true;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  // Verify webhook
  const isValid = await verifyPayPalWebhook(body, req.headers);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Handle payment capture completed
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const capture = event.resource;
    
    try {
      const amount = parseFloat(capture.amount?.value || "0") * 100; // Convert to cents
      const ticketCount = Math.floor(amount / 2000); // $20 per ticket
      
      // Get payer info
      const payerEmail = capture.payer?.email_address || 
                         event.resource?.payer?.email_address ||
                         "unknown@example.com";
      const payerName = capture.payer?.name?.given_name 
        ? `${capture.payer.name.given_name} ${capture.payer.name.surname || ""}`
        : "Anonymous";

      // Record in Convex
      const convex = getConvexClient();
      const result = await convex.mutation(api.stripe.recordPurchase, {
        email: payerEmail,
        name: payerName.trim(),
        amount: Math.round(amount),
        ticketCount: Math.max(1, ticketCount),
        stripeSessionId: capture.id, // Using PayPal capture ID
        webhookSecret: process.env.WEBHOOK_MUTATION_SECRET!,
      });

      console.log(`✅ PayPal purchase recorded: ${payerEmail}, ${ticketCount} tickets`);
      
    } catch (error) {
      console.error("Error processing PayPal payment:", error);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  // Handle order completed (alternative event)
  if (event.event_type === "CHECKOUT.ORDER.COMPLETED") {
    const order = event.resource;
    
    try {
      const purchaseUnit = order.purchase_units?.[0];
      const amount = parseFloat(purchaseUnit?.amount?.value || "0") * 100;
      const ticketCount = Math.floor(amount / 2000);
      
      const payerEmail = order.payer?.email_address || "unknown@example.com";
      const payerName = order.payer?.name?.given_name
        ? `${order.payer.name.given_name} ${order.payer.name.surname || ""}`
        : "Anonymous";

      const convex = getConvexClient();
      const result = await convex.mutation(api.stripe.recordPurchase, {
        email: payerEmail,
        name: payerName.trim(),
        amount: Math.round(amount),
        ticketCount: Math.max(1, ticketCount),
        stripeSessionId: order.id,
        webhookSecret: process.env.WEBHOOK_MUTATION_SECRET!,
      });

      console.log(`✅ PayPal order recorded: ${payerEmail}, ${ticketCount} tickets`);
      
    } catch (error) {
      console.error("Error processing PayPal order:", error);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
