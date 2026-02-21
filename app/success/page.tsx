"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="checkmark">✓</div>
        <h1>Thank You!</h1>
        <p>Your raffle tickets have been purchased successfully.</p>
        <p className="note">
          A confirmation email will be sent shortly with your ticket numbers.
        </p>
        <p className="reminder">
          🎫 Remember: You must be present at CalABA 2026 to win!
          <br />
          📅 March 5-7, 2026 • Sacramento, CA
        </p>
        <Link href="/" className="back-button">
          Back to Raffle
        </Link>
        {sessionId && (
          <p className="session-id">Reference: {sessionId.slice(-8)}</p>
        )}
      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .success-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          max-width: 480px;
        }
        .checkmark {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: white;
          margin: 0 auto 24px;
        }
        h1 {
          font-size: 32px;
          color: #f1f5f9;
          margin-bottom: 12px;
        }
        p {
          color: #94a3b8;
          margin-bottom: 16px;
        }
        .note {
          font-size: 14px;
        }
        .reminder {
          background: rgba(8, 145, 178, 0.1);
          border: 1px solid rgba(8, 145, 178, 0.3);
          border-radius: 8px;
          padding: 16px;
          font-size: 14px;
          color: #67e8f9;
          margin: 24px 0;
        }
        .back-button {
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 8px;
        }
        .session-id {
          font-size: 12px;
          color: #64748b;
          margin-top: 24px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
