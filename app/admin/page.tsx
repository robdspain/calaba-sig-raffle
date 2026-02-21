"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { DrawingAnimation } from "./DrawingAnimation";

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const [activeTab, setActiveTab] = useState<"dashboard" | "drawing" | "tickets">("dashboard");

  const summary = useQuery(api.purchases.getSummary);
  const purchases = useQuery(
    api.purchases.getAllPurchases,
    isAuthenticated ? {} : "skip"
  );
  const tickets = useQuery(
    api.purchases.getAllTickets,
    isAuthenticated ? {} : "skip"
  );
  const prizes = useQuery(api.prizes.getAll);
  const winners = useQuery(
    api.prizes.getWinners,
    isAuthenticated ? {} : "skip"
  );
  
  const recordWinner = useMutation(api.prizes.recordWinner);

  const handleWinnerSelected = async (ticket: any, prize: any) => {
    try {
      await recordWinner({
        prizeId: prize._id,
        prizeName: prize.name,
        ticketNumber: ticket.ticketNumber,
        winnerName: ticket.buyerName,
        winnerEmail: ticket.buyerEmail,
      });
    } catch (e) {
      console.error("Failed to record winner:", e);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading...</p>
        <style jsx>{`
          .loading { 
            min-height: 100vh; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            gap: 16px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #334155;
            border-top-color: #0891b2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // TEMP: Skip auth for preview (remove before production!)
  const skipAuth = true;
  
  if (!isAuthenticated && !skipAuth) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>🎟️ Raffle Admin</h1>
          <p>Sign in to manage the CalABA 2026 Book Raffle</p>
          
          <button 
            className="google-button"
            onClick={() => signIn("google")}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          
          <p className="note">Only authorized administrators can access this page.</p>
        </div>
        
        <style jsx>{`
          .login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .login-card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 48px;
            text-align: center;
            max-width: 400px;
          }
          h1 { font-size: 28px; margin-bottom: 8px; color: #f1f5f9; }
          p { color: #94a3b8; margin-bottom: 24px; }
          .google-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 14px 24px;
            background: white;
            color: #1a1a1a;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .google-button:hover { background: #f1f5f9; }
          .note { font-size: 12px; color: #64748b; margin: 0; }
        `}</style>
      </div>
    );
  }

  // Authenticated admin view
  return (
    <div className="admin">
      <header className="header">
        <div className="header-content">
          <h1>🎟️ Raffle Admin Dashboard</h1>
          <div className="header-actions">
            <nav className="tabs">
              <button 
                className={activeTab === "dashboard" ? "active" : ""}
                onClick={() => setActiveTab("dashboard")}
              >
                📊 Dashboard
              </button>
              <button 
                className={activeTab === "drawing" ? "active" : ""}
                onClick={() => setActiveTab("drawing")}
              >
                🎰 Live Drawing
              </button>
              <button 
                className={activeTab === "tickets" ? "active" : ""}
                onClick={() => setActiveTab("tickets")}
              >
                🎫 Tickets
              </button>
            </nav>
            <button className="signout" onClick={() => signOut()}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="container">
        {activeTab === "dashboard" && (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Tickets Sold</span>
                <span className="stat-value">{summary?.totalTickets ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Revenue</span>
                <span className="stat-value">${summary?.totalRevenue?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Purchases</span>
                <span className="stat-value">{summary?.totalPurchases ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Remaining</span>
                <span className="stat-value">{summary?.ticketsRemaining ?? 100}</span>
              </div>
            </div>

            {/* Recent Winners */}
            {winners && winners.length > 0 && (
              <section className="card">
                <h2>🏆 Winners</h2>
                <table className="purchases-table">
                  <thead>
                    <tr>
                      <th>Prize</th>
                      <th>Winner</th>
                      <th>Ticket #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((w) => (
                      <tr key={w._id}>
                        <td>{w.prizeName}</td>
                        <td>{w.winnerName}</td>
                        <td>#{w.ticketNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Purchases Table */}
            <section className="card">
              <h2>📋 Purchase History</h2>
              <table className="purchases-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Tickets</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases?.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.email}</td>
                      <td>{p.ticketCount}</td>
                      <td>${(p.amount / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!purchases || purchases.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>
                        No purchases yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === "drawing" && (
          <section className="card drawing-section">
            <h2>🎰 Live Prize Drawing</h2>
            <p className="drawing-instructions">
              Use this at CalABA to draw winners live! Each ticket can only win once.
            </p>
            {tickets && prizes && (
              <DrawingAnimation 
                tickets={tickets}
                prizes={prizes.map(p => ({ name: p.name, sponsor: p.sponsor }))}
                onWinnerSelected={handleWinnerSelected}
              />
            )}
          </section>
        )}

        {activeTab === "tickets" && (
          <section className="card">
            <h2>🎫 All Tickets ({tickets?.length ?? 0})</h2>
            <div className="tickets-grid">
              {tickets?.map((ticket) => (
                <div key={ticket._id} className="ticket-chip">
                  <span className="ticket-num">#{ticket.ticketNumber}</span>
                  <span className="ticket-owner">{ticket.buyerName}</span>
                </div>
              ))}
              {(!tickets || tickets.length === 0) && (
                <p style={{ color: "#64748b" }}>No tickets sold yet</p>
              )}
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .admin { min-height: 100vh; }
        .header {
          background: linear-gradient(135deg, #1e3a5f, #0c4a6e);
          padding: 16px 24px;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        h1 { font-size: 20px; color: white; margin: 0; }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .tabs {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.2);
          padding: 4px;
          border-radius: 8px;
        }
        .tabs button {
          padding: 8px 16px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        .tabs button.active {
          background: rgba(255,255,255,0.15);
          color: white;
        }
        .signout {
          padding: 8px 16px;
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          font-size: 13px;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .stat-label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #0891b2;
        }
        
        .card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .card h2 {
          font-size: 18px;
          color: #0891b2;
          margin-bottom: 16px;
        }
        
        .drawing-section {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border: 2px solid #334155;
        }
        .drawing-instructions {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .tickets-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ticket-chip {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .ticket-num { font-weight: 700; color: #0891b2; }
        .ticket-owner { color: #94a3b8; font-size: 13px; }
        
        .purchases-table {
          width: 100%;
          border-collapse: collapse;
        }
        .purchases-table th,
        .purchases-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #334155;
        }
        .purchases-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
        }
        .purchases-table td { color: #e2e8f0; }
      `}</style>
    </div>
  );
}
