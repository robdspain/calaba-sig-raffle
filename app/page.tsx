"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import Script from "next/script";
import Image from "next/image";

declare global {
  interface Window {
    paypal?: any;
  }
}

const PRIZES = [
  {
    title: "1-Hour Private Zoom Consultation",
    description: "One-on-one session with renowned behavioral scientist. Discuss data analysis, behavioral theory, your research, or philosophy of science.",
    donor: "Dr. Peter Killeen, Arizona State University",
    donorUrl: "https://search.asu.edu/profile/10609",
    value: "$200+",
    image: "https://www.abainternational.org/media/59054/killeenpeter.jpg",
    imageStyle: "cover",
    imagePosition: "top",
  },
  {
    title: "75 Social Games & Activities to Spark Engagement",
    description: "Brand new release! Toy-free social routines for building communication skills through play.",
    donor: "Dr. Jamie Hughes-Lika, Sage Learning Systems",
    donorUrl: "https://sagelearningsystems.com",
    value: "$25",
    image: "https://assets.lulu.com/cover_thumbs/e/7/e7j26ek-front-shortedge-384.jpg",
    imageStyle: "cover",
  },
  {
    title: "Do Better Collective Bundle",
    description: "Course gift cards, membership access, PLUS the Do Better Guide Workshop Companion workbook.",
    donor: "Megan DeLeon Miller, Do Better Collective",
    donorUrl: "https://dobettercollective.com",
    value: "$75+",
    image: "https://dobettercollective.com/wp-content/uploads/dbcfavicon-hq_opt-300x300.png",
    imageStyle: "contain",
    imageBg: "#fff",
  },
  {
    title: "Essential for Living User Manuals (3 copies)",
    description: "Three copies of the Essential for Living user manual - a comprehensive functional skills curriculum and assessment tool for individuals with developmental disabilities.",
    donor: "Reginald Ponio, BABAC",
    donorUrl: "https://babac.org",
    value: "$150+",
    image: "https://difflearn.com/cdn/shop/files/16.png?crop=center&height=400&v=1759769483&width=400",
    imageStyle: "contain",
    imageBg: "#fff",
  },
  {
    title: "SBT Guidebook & Workbook + PFA/SBT Swag Bundle",
    description: "School-based implementation guidebook and workbook for Skill-Based Treatment, plus PFA & SBT Community swag including t-shirt, stickers, and bag.",
    donor: "Nicola Schneider, NRS Compassionate Behavior Services",
    donorUrl: "https://www.nrscompassionatebehavior.com",
    value: "$75+",
    image: "/nicola-swag.jpeg",
    imageStyle: "cover",
  },
  {
    title: "Free Entry to OBM Practitioner Program",
    description: "Complete access to the OBM (Organizational Behavior Management) Practitioner program - learn to apply behavior analysis principles in organizational settings.",
    donor: "Mellanie Page, OBM Practitioner",
    donorUrl: "https://theabacollective.myflodesk.com/obmpractitioner",
    value: "$500+",
    image: "/mellanie-page.jpg",
    imageStyle: "cover",
    imagePosition: "top",
  },
  {
    title: "1 Free BACB CEU — ABACC Workshop",
    description: "Gift certificate for 1 Learning BACB CEU at any ABA Climate Coalition workshop. Apply behavior analysis to climate action and sustainability.",
    donor: "Caroly Shumway, Ph.D., ABA Climate Coalition",
    donorUrl: "https://www.abaclimatecoalition.com",
    value: "$29",
    emoji: "🌍",
  },
  {
    title: "6-Month Behavior Study Tools Subscription",
    description: "Full access to 10,000+ AI-generated BCBA exam practice questions, mock exams, AI Tutor, and adaptive learning — everything you need to pass the BCBA exam.",
    donor: "Rob Spain, BehaviorSchool",
    donorUrl: "https://study.behaviorschool.com",
    value: "$180",
    image: "/behaviorstudytools-certificate.png",
    imageStyle: "cover",
    imageBg: "#1a1a1a",
  },
  {
    title: "Signed Book + 20-Minute Mentor Session",
    description: "A copy of a book by Portia C. James, M.A., BCBA, CEO of Behavior Genius — plus a free 20-minute one-on-one mentor session. Behavior Genius is building a movement in culturally responsive, community-centered ABA therapy.",
    donor: "Portia C. James, Behavior Genius",
    donorUrl: "https://www.behaviorgenius.com",
    value: "Book + Consultation",
    emoji: "📚",
  },
];

const TICKET_OPTIONS = [
  { count: 1, price: 10, label: "$10", perTicket: "$10 each" },
  { count: 3, price: 25, label: "$25", perTicket: "$8.33 each" },
  { count: 7, price: 40, label: "$40", perTicket: "$5.71 each" },
];

export default function Home() {
  const summary = useQuery(api.purchases.getSummary);
  const [selectedOption, setSelectedOption] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const ticketsSold = summary?.totalTickets ?? 0;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const progressPercent = Math.min(100, (totalRevenue / 2000) * 100);
  const selectedTicket = TICKET_OPTIONS[selectedOption];

  // Countdown to CalABA (March 6, 2026 6:00 PM PST)
  useEffect(() => {
    const target = new Date("2026-03-06T18:00:00-08:00").getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize PayPal button
  useEffect(() => {
    if (!paypalLoaded || !window.paypal) return;
    const container = document.getElementById("paypal-button-container");
    if (!container) return;
    container.innerHTML = "";

    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "blue",
        shape: "rect",
        label: "paypal",
        height: 45,
      },
      createOrder: (_data: any, actions: any) => {
        if (!name || !email) {
          alert("Please enter your name and email first!");
          return Promise.reject("Missing info");
        }
        return actions.order.create({
          purchase_units: [{
            description: `CalABA 2026 Raffle - ${selectedTicket.count} Ticket${selectedTicket.count > 1 ? "s" : ""}`,
            amount: {
              currency_code: "USD",
              value: selectedTicket.price.toFixed(2),
            },
            custom_id: JSON.stringify({ name, email, tickets: selectedTicket.count }),
          }],
        });
      },
      onApprove: async (_data: any, actions: any) => {
        const order = await actions.order.capture();
        window.location.href = `/success?order_id=${order.id}&tickets=${selectedTicket.count}`;
      },
      onError: (err: any) => {
        console.error("PayPal error:", err);
      },
    }).render("#paypal-button-container");
  }, [paypalLoaded, selectedOption, name, email, selectedTicket]);

  return (
    <main className="main">
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb"}&currency=USD`}
        onLoad={() => setPaypalLoaded(true)}
      />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🎟️ CalABA 2026 Conference</div>
          <h1>CalABA SIG Raffle</h1>
          <p>Win books, consultations, and more from CalABA speakers. Proceeds benefit CalABA</p>
          
          <div className="countdown">
            <div className="countdown-item">
              <span className="countdown-number">{countdown.days}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{countdown.hours}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{countdown.minutes}</span>
              <span className="countdown-label">Min</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{countdown.seconds}</span>
              <span className="countdown-label">Sec</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Progress - only show after 33% */}
        {progressPercent >= 33 && (
          <section className="card progress-section">
            <h2>Help Support CalABA 🎉</h2>
            <p className="progress-label">
              <strong>${totalRevenue.toFixed(0)}</strong> raised of $2000 goal ({progressPercent.toFixed(0)}%)
            </p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.max(2, progressPercent)}%` }} />
            </div>
            <p className="progress-tickets">{summary?.totalPurchases ?? 0} ticket purchases</p>
          </section>
        )}

        {/* Event Details */}
        <section className="card">
          <h2>📅 Event Details</h2>
          <div className="event-grid">
            <div className="event-item">
              <strong>Date</strong>
              <span>Friday, March 6</span>
            </div>
            <div className="event-item">
              <strong>Time</strong>
              <span>6:00 PM</span>
            </div>
            <div className="event-item">
              <strong>Location</strong>
              <span>Room 8</span>
            </div>
            <div className="event-item">
              <strong>Drawings</strong>
              <span>From 6:00 PM</span>
            </div>
          </div>
        </section>

        {/* Prizes */}
        <section className="card prizes-section">
          <h2>🏆 Prizes</h2>
          <div className="prizes-grid">
            {PRIZES.map((prize, i) => (
              <div key={i} className="prize-card">
                {prize.image ? (
                  <img 
                    src={prize.image} 
                    alt={prize.title} 
                    className="prize-image" 
                    style={{
                      objectFit: prize.imageStyle === "contain" ? "contain" : "cover",
                      objectPosition: prize.imagePosition || "center",
                      background: prize.imageBg || "transparent",
                      padding: prize.imageStyle === "contain" ? "8px" : "0",
                    }}
                  />
                ) : prize.emoji ? (
                  <div className="prize-icon">{prize.emoji}</div>
                ) : null}
                <div className="prize-content">
                  <h3>{prize.title}</h3>
                  <p className="prize-desc">{prize.description}</p>
                  <p className="prize-donor">
                    <a href={prize.donorUrl} target="_blank" rel="noopener noreferrer">
                      {prize.donor}
                    </a>
                  </p>
                  <span className="prize-value">Value: {prize.value}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="more-prizes">🎁 More prizes being added weekly — check back soon!</p>
        </section>

        {/* Purchase Section */}
        <section className="card purchase-section">
          <h2>🎟️ Get Raffle Tickets</h2>
          <p className="purchase-warning">⏰ Online sales end Friday, March 6 at 12 PM!</p>
          <p>Get your tickets now before the cutoff.</p>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div className="ticket-options">
            {TICKET_OPTIONS.map((option, i) => (
              <button
                key={i}
                className={`ticket-option ${selectedOption === i ? "selected" : ""}`}
                onClick={() => setSelectedOption(i)}
              >
                <span className="option-price">{option.label}</span>
                <span className="option-count">{option.count} ticket{option.count > 1 ? "s" : ""}</span>
                <span className="option-per">{option.perTicket}</span>
              </button>
            ))}
          </div>

          <a
            href="https://www.paypal.com/ncp/payment/S2SUQFGT9XSSQ"
            target="_blank"
            rel="noopener noreferrer"
            className="buy-tickets-btn"
            style={{
              display: "block",
              width: "100%",
              background: "#0070ba",
              color: "white",
              textAlign: "center",
              padding: "16px",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "18px",
              textDecoration: "none",
              marginTop: "16px",
              boxShadow: "0 4px 14px rgba(0,112,186,0.35)"
            }}
          >
            Buy Tickets via PayPal →
          </a>
          <p style={{ textAlign: "center", fontSize: "13px", color: "#888", marginTop: "8px" }}>
            Secure checkout via PayPal · $10 / ticket · $25 for 3 · $40 for 7
          </p>
        </section>

        {/* Must Be Present */}
        <section className="card warning-section">
          <h2>⚠️ Must Be Present to Win</h2>
          <ul>
            <li>You must be present to win! Winners drawn throughout the event.</li>
            <li>Raffle drawings begin at 6:00 PM and continue throughout the reception</li>
            <li>Online ticket sales close Friday at 12 PM</li>
            <li>Tickets also available at the door during the reception</li>
          </ul>
        </section>

        {/* Footer */}
        <footer>
          <div className="footer-logos">
            <img src="/calaba-logo.svg" alt="CalABA" className="footer-logo-main" />
          </div>
          <div className="footer-sigs">
            <span>CalABA Special Interest Groups</span>
            <div className="sig-logos">
              <img src="/bae-sig-logo.png" alt="BAE SIG" />
              <img src="/babac-logo.jpg" alt="BABAC" />
              <img src="/biba-logo.png" alt="BIBA" />
            </div>
          </div>
          <p>v1.1 | A collaborative fundraiser benefiting CalABA</p>
          <p>Questions: <a href="mailto:california.bae.sig@gmail.com">california.bae.sig@gmail.com</a></p>
        </footer>
      </div>

      <style jsx>{`
        .main {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        
        .hero {
          background: linear-gradient(135deg, #1e3a5f 0%, #0c4a6e 50%, #0891b2 100%);
          color: white;
          padding: 48px 24px;
          text-align: center;
        }
        .hero-content { max-width: 600px; margin: 0 auto; }
        .hero-badge {
          display: inline-block;
          background: rgba(255,255,255,0.15);
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .hero h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
        .hero p { font-size: 16px; opacity: 0.9; }
        
        .countdown { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
        .countdown-item {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          min-width: 65px;
        }
        .countdown-number { font-size: 24px; font-weight: 800; display: block; }
        .countdown-label { font-size: 10px; text-transform: uppercase; opacity: 0.8; }
        
        .container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
        
        .card {
          background: white;
          color: #1a1a1a;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .card h2 { font-size: 20px; margin-bottom: 16px; color: #1e3a5f; }
        
        .progress-section { text-align: center; }
        .progress-label { font-size: 16px; color: #525252; margin-bottom: 12px; }
        .progress-label strong { color: #0891b2; font-size: 24px; }
        .progress-bar {
          height: 16px;
          background: #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0891b2, #06b6d4);
          border-radius: 8px;
          transition: width 0.5s ease;
        }
        .progress-tickets { font-size: 14px; color: #64748b; }
        
        .event-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .event-item {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        .event-item strong { display: block; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
        .event-item span { font-size: 16px; font-weight: 600; color: #1e3a5f; }
        
        .prizes-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .prize-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: row;
        }
        .prize-image {
          width: 120px;
          min-width: 120px;
          height: 120px;
          flex-shrink: 0;
        }
        .prize-icon {
          width: 120px;
          min-width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: #f8fafc;
        }
        .prize-content { padding: 16px; flex: 1; }
        .prize-card h3 { font-size: 16px; font-weight: 700; color: #1e3a5f; margin-bottom: 6px; }
        .prize-desc { font-size: 13px; color: #525252; margin-bottom: 8px; line-height: 1.4; }
        .prize-donor { font-size: 13px; margin-bottom: 4px; }
        .prize-donor a { color: #0891b2; text-decoration: none; font-weight: 500; }
        .prize-donor a:hover { text-decoration: underline; }
        .prize-value { font-size: 14px; font-weight: 700; color: #059669; }
        
        @media (max-width: 500px) {
          .prize-card { flex-direction: column; }
          .prize-image, .prize-icon { width: 100%; height: 160px; }
        }
        .more-prizes { text-align: center; margin-top: 20px; font-size: 14px; color: #64748b; }
        
        .purchase-section { text-align: center; }
        .purchase-warning {
          background: #fef3c7;
          color: #92400e;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 20px 0;
        }
        .input {
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          width: 100%;
        }
        .input:focus { border-color: #0891b2; outline: none; }
        
        .ticket-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 20px 0;
        }
        .ticket-option {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ticket-option.selected {
          border-color: #0891b2;
          background: #f0fdfa;
        }
        .option-price { display: block; font-size: 24px; font-weight: 800; color: #1e3a5f; }
        .option-count { display: block; font-size: 14px; color: #525252; margin: 4px 0; }
        .option-per { display: block; font-size: 12px; color: #64748b; }
        
        .paypal-container { max-width: 400px; margin: 20px auto; }
        
        .donation-link {
          display: inline-block;
          margin-top: 16px;
          color: #059669;
          font-weight: 600;
          text-decoration: none;
        }
        
        .warning-section ul {
          list-style: none;
          padding: 0;
        }
        .warning-section li {
          padding: 8px 0;
          padding-left: 24px;
          position: relative;
          color: #525252;
        }
        .warning-section li::before {
          content: "•";
          position: absolute;
          left: 8px;
          color: #f59e0b;
        }
        
        footer {
          text-align: center;
          padding: 32px 0;
          color: #94a3b8;
          font-size: 14px;
        }
        footer a { color: #0891b2; }
        .footer-logos { margin-bottom: 16px; }
        .footer-logo-main { height: 60px; margin-bottom: 16px; }
        .footer-sigs { margin-bottom: 16px; }
        .footer-sigs span { display: block; font-weight: 600; margin-bottom: 12px; }
        .sig-logos { display: flex; justify-content: center; gap: 16px; align-items: center; }
        .sig-logos img { height: 40px; border-radius: 8px; }
      `}</style>
    </main>
  );
}
