import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Default prizes for the raffle
const DEFAULT_PRIZES = [
  { name: "1-Hour Private Zoom Consultation", sponsor: "Dr. Peter Killeen, Arizona State University", order: 1 },
  { name: "75 Social Games & Activities Book", sponsor: "Dr. Jamie Hughes-Lika, Sage Learning Systems", order: 2 },
  { name: "Do Better Collective Bundle", sponsor: "Megan DeLeon Miller, Do Better Collective", order: 3 },
  { name: "Essential for Living User Manuals (3 copies)", sponsor: "Reginald Ponio, BABAC", order: 4 },
  { name: "SBT Guidebook & Workbook + Swag Bundle", sponsor: "Nicola Schneider, NRS Compassionate Behavior Services", order: 5 },
  { name: "Free Entry to OBM Practitioner Program", sponsor: "Mellanie Page, OBM Practitioner", order: 6 },
  { name: "1 Free BACB CEU — ABACC Workshop", sponsor: "Caroly Shumway, Ph.D., ABA Climate Coalition", order: 7 },
  { name: "6-Month Behavior Study Tools Subscription", sponsor: "Rob Spain, BehaviorSchool", order: 8 },
  { name: "Signed Book + 20-Minute Mentor Session", sponsor: "Portia C. James, Behavior Genius", order: 9 },
];

// Get all prizes
export const getAll = query({
  handler: async (ctx) => {
    const prizes = await ctx.db.query("prizes").collect();
    
    // Return defaults if no prizes configured
    if (prizes.length === 0) {
      return DEFAULT_PRIZES.map((p, i) => ({ ...p, _id: `default-${i}` }));
    }
    
    return prizes.sort((a, b) => a.order - b.order);
  },
});

// Add prize (admin only)
export const add = mutation({
  args: {
    name: v.string(),
    sponsor: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("prizes", args);
  },
});

// Remove prize (admin only)
export const remove = mutation({
  args: { id: v.id("prizes") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    await ctx.db.delete(args.id);
  },
});

// Record winner
export const recordWinner = mutation({
  args: {
    prizeId: v.optional(v.string()),
    prizeName: v.string(),
    ticketNumber: v.number(),
    winnerName: v.string(),
    winnerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("winners", {
      ...args,
      drawnAt: Date.now(),
    });
  },
});

// Get all winners
export const getWinners = query({
  handler: async (ctx) => {
    return await ctx.db.query("winners").order("asc").collect();
  },
});
