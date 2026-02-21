import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";

// Public: Get summary stats (no auth required)
export const getSummary = query({
  handler: async (ctx) => {
    const completedPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    
    const totalTickets = completedPurchases.reduce((sum, p) => sum + p.ticketCount, 0);
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalTickets,
      totalRevenue: totalRevenue / 100, // dollars
      totalPurchases: completedPurchases.length,
      ticketsRemaining: Math.max(0, 100 - totalTickets),
    };
  },
});

// Admin: Get all purchases (requires auth)
export const getAllPurchases = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .collect();
    
    return purchases;
  },
});

// Internal: Create pending purchase (called from checkout API)
export const createPendingPurchase = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    amount: v.number(),
    ticketCount: v.number(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("purchases", {
      ...args,
      status: "pending",
    });
  },
});

// Internal: Complete purchase and create tickets (called from webhook)
export const completePurchase = internalMutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the pending purchase
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();
    
    if (!purchase) {
      throw new Error(`Purchase not found for session ${args.stripeSessionId}`);
    }
    
    if (purchase.status === "completed") {
      // Already processed (idempotent)
      return { purchaseId: purchase._id, alreadyProcessed: true };
    }
    
    // Update purchase status
    await ctx.db.patch(purchase._id, {
      status: "completed",
      stripePaymentIntentId: args.stripePaymentIntentId,
    });
    
    // Get current ticket count to assign numbers
    const existingTickets = await ctx.db.query("tickets").collect();
    let nextTicketNumber = existingTickets.length + 1;
    
    // Create ticket records
    const ticketIds = [];
    for (let i = 0; i < purchase.ticketCount; i++) {
      const ticketId = await ctx.db.insert("tickets", {
        purchaseId: purchase._id,
        ticketNumber: nextTicketNumber++,
        buyerEmail: purchase.email,
        buyerName: purchase.name,
      });
      ticketIds.push(ticketId);
    }
    
    return { purchaseId: purchase._id, ticketIds, alreadyProcessed: false };
  },
});

// Admin: Get all tickets for drawing
export const getAllTickets = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.db
      .query("tickets")
      .withIndex("by_ticket_number")
      .collect();
  },
});

// Admin: Draw random winner
export const drawRandomWinner = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const tickets = await ctx.db.query("tickets").collect();
    if (tickets.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * tickets.length);
    return tickets[randomIndex];
  },
});

// Internal: Create and complete purchase in one call (for webhook)
export const createAndCompletePurchase = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    amount: v.number(),
    ticketCount: v.number(),
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
    
    return { purchaseId, ticketIds, alreadyProcessed: false };
  },
});
