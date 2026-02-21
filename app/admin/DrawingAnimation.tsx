"use client";

import { useState, useEffect, useCallback } from "react";

interface Ticket {
  _id: string;
  ticketNumber: number;
  buyerName: string;
  buyerEmail: string;
}

interface Prize {
  name: string;
  sponsor?: string;
  image?: string;
}

interface DrawingAnimationProps {
  tickets: Ticket[];
  prizes: Prize[];
  onWinnerSelected?: (ticket: Ticket, prize: Prize) => void;
}

export function DrawingAnimation({ tickets, prizes, onWinnerSelected }: DrawingAnimationProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [winner, setWinner] = useState<Ticket | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState(50);
  const [drawnTickets, setDrawnTickets] = useState<Set<number>>(new Set());

  const availableTickets = tickets.filter(t => !drawnTickets.has(t.ticketNumber));

  const spin = useCallback(() => {
    if (availableTickets.length === 0 || !prizes[prizeIndex]) return;
    
    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);
    setSelectedPrize(prizes[prizeIndex]);
    
    let iterations = 0;
    const maxIterations = 30 + Math.floor(Math.random() * 20);
    let currentSpeed = 50;
    
    const animate = () => {
      const randomIndex = Math.floor(Math.random() * availableTickets.length);
      setCurrentTicket(availableTickets[randomIndex]);
      iterations++;
      
      // Slow down as we approach the end
      if (iterations > maxIterations * 0.7) {
        currentSpeed = Math.min(400, currentSpeed * 1.15);
      }
      
      if (iterations < maxIterations) {
        setTimeout(animate, currentSpeed);
      } else {
        // Final selection
        const winnerIndex = Math.floor(Math.random() * availableTickets.length);
        const selectedWinner = availableTickets[winnerIndex];
        setCurrentTicket(selectedWinner);
        setWinner(selectedWinner);
        setIsSpinning(false);
        setShowConfetti(true);
        setDrawnTickets(prev => new Set([...prev, selectedWinner.ticketNumber]));
        
        if (onWinnerSelected) {
          onWinnerSelected(selectedWinner, prizes[prizeIndex]);
        }
        
        // Auto-advance to next prize
        setTimeout(() => {
          setPrizeIndex(prev => prev + 1);
        }, 5000);
      }
    };
    
    animate();
  }, [availableTickets, prizes, prizeIndex, onWinnerSelected]);

  const resetDrawing = () => {
    setWinner(null);
    setCurrentTicket(null);
    setShowConfetti(false);
    setDrawnTickets(new Set());
    setPrizeIndex(0);
    setSelectedPrize(null);
  };

  const currentPrize = prizes[prizeIndex];

  return (
    <div className="drawing-container">
      {/* Prize Display */}
      <div className="prize-display">
        <h3>🎁 Now Drawing For:</h3>
        {currentPrize ? (
          <div className="prize-card">
            <span className="prize-name">{currentPrize.name}</span>
            {currentPrize.sponsor && (
              <span className="prize-sponsor">Donated by {currentPrize.sponsor}</span>
            )}
          </div>
        ) : (
          <div className="prize-card done">
            <span className="prize-name">🎉 All Prizes Drawn!</span>
          </div>
        )}
        <div className="prize-progress">
          Prize {Math.min(prizeIndex + 1, prizes.length)} of {prizes.length}
        </div>
      </div>

      {/* Slot Machine Style Display */}
      <div className={`slot-machine ${isSpinning ? "spinning" : ""} ${winner ? "winner" : ""}`}>
        {showConfetti && <div className="confetti-burst" />}
        
        <div className="slot-window">
          {currentTicket ? (
            <>
              <div className="ticket-number">
                <span className="label">Ticket</span>
                <span className="number">#{currentTicket.ticketNumber}</span>
              </div>
              <div className="winner-name">{currentTicket.buyerName}</div>
              {winner && (
                <div className="winner-badge">🏆 WINNER!</div>
              )}
            </>
          ) : (
            <div className="placeholder">
              <span>🎟️</span>
              <span>Press DRAW to begin</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className="draw-button"
          onClick={spin}
          disabled={isSpinning || availableTickets.length === 0 || !currentPrize}
        >
          {isSpinning ? (
            <>🎰 SPINNING...</>
          ) : winner ? (
            <>🎁 DRAW NEXT PRIZE</>
          ) : (
            <>🎲 DRAW WINNER</>
          )}
        </button>
        
        <button className="reset-button" onClick={resetDrawing}>
          🔄 Reset All
        </button>
      </div>

      {/* Stats */}
      <div className="drawing-stats">
        <span>🎫 {availableTickets.length} tickets remaining</span>
        <span>🏆 {drawnTickets.size} winners drawn</span>
      </div>

      {/* Winners List */}
      {drawnTickets.size > 0 && (
        <div className="winners-list">
          <h4>🏆 Winners</h4>
          {Array.from(drawnTickets).map((ticketNum, idx) => {
            const ticket = tickets.find(t => t.ticketNumber === ticketNum);
            const prize = prizes[idx];
            return (
              <div key={ticketNum} className="winner-row">
                <span className="winner-prize">{prize?.name}</span>
                <span className="winner-info">
                  #{ticketNum} - {ticket?.buyerName}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .drawing-container {
          text-align: center;
          padding: 24px;
        }

        .prize-display {
          margin-bottom: 32px;
        }
        .prize-display h3 {
          font-size: 18px;
          color: #94a3b8;
          margin-bottom: 12px;
        }
        .prize-card {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 12px;
          padding: 20px 32px;
          display: inline-block;
        }
        .prize-card.done {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .prize-name {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: white;
        }
        .prize-sponsor {
          display: block;
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          margin-top: 4px;
        }
        .prize-progress {
          font-size: 12px;
          color: #64748b;
          margin-top: 12px;
        }

        .slot-machine {
          background: linear-gradient(180deg, #1e293b, #0f172a);
          border: 4px solid #334155;
          border-radius: 20px;
          padding: 40px;
          margin: 0 auto 24px;
          max-width: 400px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .slot-machine.spinning {
          border-color: #0891b2;
          box-shadow: 0 0 30px rgba(8, 145, 178, 0.3);
        }
        .slot-machine.winner {
          border-color: #10b981;
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.4);
          animation: winner-pulse 0.5s ease-in-out 3;
        }
        @keyframes winner-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .confetti-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          animation: confetti-explode 1s ease-out forwards;
        }
        @keyframes confetti-explode {
          0% { box-shadow: 0 0 #f59e0b, 0 0 #10b981, 0 0 #0891b2, 0 0 #ec4899; }
          100% { box-shadow: 
            -80px -80px #f59e0b, 80px -60px #10b981, 
            -60px 80px #0891b2, 70px 70px #ec4899,
            -40px -100px #8b5cf6, 100px 20px #ef4444,
            0px -120px #fbbf24, -100px 40px #22d3ee;
            opacity: 0;
          }
        }

        .slot-window {
          background: #0f172a;
          border-radius: 12px;
          padding: 32px;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ticket-number {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 12px;
        }
        .ticket-number .label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
        }
        .ticket-number .number {
          font-size: 48px;
          font-weight: 900;
          color: #0891b2;
          font-family: monospace;
          text-shadow: 0 0 20px rgba(8, 145, 178, 0.5);
        }
        .spinning .ticket-number .number {
          animation: number-blur 0.1s linear infinite;
        }
        @keyframes number-blur {
          0%, 100% { filter: blur(0); }
          50% { filter: blur(2px); }
        }

        .winner-name {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .winner-badge {
          margin-top: 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          padding: 8px 24px;
          border-radius: 50px;
          font-size: 18px;
          font-weight: 800;
          color: white;
          animation: badge-pop 0.5s ease-out;
        }
        @keyframes badge-pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .placeholder {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #64748b;
          font-size: 18px;
        }
        .placeholder span:first-child {
          font-size: 48px;
        }

        .controls {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .draw-button {
          padding: 16px 48px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 20px;
          font-weight: 800;
          transition: all 0.2s;
        }
        .draw-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
        .draw-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reset-button {
          padding: 16px 24px;
          background: #334155;
          color: #94a3b8;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        .drawing-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .winners-list {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          max-width: 500px;
          margin: 0 auto;
        }
        .winners-list h4 {
          font-size: 16px;
          color: #f59e0b;
          margin-bottom: 12px;
        }
        .winner-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #334155;
          font-size: 14px;
        }
        .winner-row:last-child { border: none; }
        .winner-prize { color: #f1f5f9; font-weight: 600; }
        .winner-info { color: #94a3b8; }
      `}</style>
    </div>
  );
}
