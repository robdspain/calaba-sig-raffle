import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Public mutation for webhook - secured by webhook signature verification on Next.js side
export const recordPurchase = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    amount: v.number(),
    ticketCount: v.number(),
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    webhookSecret: v.string(), // Additional verification
  },
  handler: async (ctx, args) => {
    // Verify webhook secret (defense in depth)
    if (args.webhookSecret !== process.env.WEBHOOK_MUTATION_SECRET) {
      throw new Error("Invalid webhook secret");
    }
    
    // Check if already processed (idempotent)
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();
    
    if (existing) {
      return { purchaseId: existing._id, alreadyProcessed: true };
    }
    
    // Create completed purchase
    const purchaseId = await ctx.db.insert("purchases", {
      email: args.email,
      name: args.name,
      amount: args.amount,
      ticketCount: args.ticketCount,
      stripeSessionId: args.stripeSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: "completed",
    });
    
    // Get current ticket count to assign numbers
    const existingTickets = await ctx.db.query("tickets").collect();
    let nextTicketNumber = existingTickets.length + 1;
    
    // Create ticket records
    const ticketIds = [];
    for (let i = 0; i < args.ticketCount; i++) {
      const ticketId = await ctx.db.insert("tickets", {
        purchaseId,
        ticketNumber: nextTicketNumber++,
        buyerEmail: args.email,
        buyerName: args.name,
      });
      ticketIds.push(ticketId);
    }
    
    return { purchaseId, ticketIds, ticketNumbers: Array.from({ length: args.ticketCount }, (_, i) => existingTickets.length + 1 + i) };
  },
});
