import { mutation } from "./_generated/server";

// Seed test data for demo
export const seedTestData = mutation({
  handler: async (ctx) => {
    // Add test purchases and tickets
    const testBuyers = [
      { name: "Jane Smith", email: "jane@test.com" },
      { name: "John Doe", email: "john@test.com" },
      { name: "Sarah Johnson", email: "sarah@test.com" },
      { name: "Mike Brown", email: "mike@test.com" },
      { name: "Emily Davis", email: "emily@test.com" },
    ];
    
    let ticketNum = 1;
    for (const buyer of testBuyers) {
      const purchaseId = await ctx.db.insert("purchases", {
        email: buyer.email,
        name: buyer.name,
        amount: 2000,
        ticketCount: 1,
        stripeSessionId: `test-${Date.now()}-${ticketNum}`,
        status: "completed",
      });
      
      await ctx.db.insert("tickets", {
        purchaseId,
        ticketNumber: ticketNum++,
        buyerEmail: buyer.email,
        buyerName: buyer.name,
      });
    }
    
    return { ticketsCreated: testBuyers.length };
  },
});
