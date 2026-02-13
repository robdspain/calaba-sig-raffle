import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  // Simple token-based auth for admin access
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN || 'calaba-admin-2026';
  
  // Allow public access for summary stats, require auth for full details
  const isAdmin = authHeader === `Bearer ${adminToken}`;
  const summaryOnly = req.query.summary === 'true';

  try {
    // Get list of all purchase IDs
    const purchaseIds = await kv.lrange('purchases:list', 0, -1) || [];
    
    if (purchaseIds.length === 0) {
      return res.status(200).json({
        purchases: [],
        summary: {
          totalRevenue: 0,
          totalTickets: 0,
          totalPurchases: 0
        }
      });
    }

    // Fetch all purchases
    const purchases = [];
    let totalRevenue = 0;
    let totalTickets = 0;

    for (const purchaseId of purchaseIds) {
      const purchaseJson = await kv.get(`purchase:${purchaseId}`);
      if (purchaseJson) {
        const purchase = typeof purchaseJson === 'string' 
          ? JSON.parse(purchaseJson) 
          : purchaseJson;
        
        purchases.push(purchase);
        totalRevenue += purchase.amount || 0;
        totalTickets += purchase.ticketCount || 0;
      }
    }

    // Sort by timestamp (newest first)
    purchases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const summary = {
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      totalTickets,
      totalPurchases: purchases.length
    };

    // Return summary only for public access
    if (summaryOnly) {
      return res.status(200).json({ summary });
    }

    // Return full details only for admin
    if (!isAdmin) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Admin token required for full purchase details' 
      });
    }

    return res.status(200).json({
      purchases,
      summary
    });

  } catch (error) {
    console.error('Error fetching purchases:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch purchases',
      detail: error.message 
    });
  }
}
