import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  // One record per Stripe checkout
  purchases: defineTable({
    email: v.string(),
    name: v.string(),
    amount: v.number(), // cents
    ticketCount: v.number(),
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  })
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
  
  // One record per ticket (for random drawing)
  tickets: defineTable({
    purchaseId: v.id("purchases"),
    ticketNumber: v.number(), // 1-100
    buyerEmail: v.string(),
    buyerName: v.string(),
  })
    .index("by_purchase", ["purchaseId"])
    .index("by_ticket_number", ["ticketNumber"]),
  
  // Prizes for the raffle
  prizes: defineTable({
    name: v.string(),
    sponsor: v.optional(v.string()),
    order: v.number(),
  }),
  
  // Winners record
  winners: defineTable({
    prizeId: v.optional(v.string()),
    prizeName: v.string(),
    ticketNumber: v.number(),
    winnerName: v.string(),
    winnerEmail: v.string(),
    drawnAt: v.number(),
  }),
});
