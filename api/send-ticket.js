import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { to_email, to_name, ticket_count, amount, ticket_ids, ticket_image, type } = req.body;

  if (!to_email || !to_name) return res.status(400).json({ error: 'Missing name or email' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const isCert = type === 'certificate';
  const subject = isCert
    ? `🎉 You Won! CalABA 2026 Raffle — Congratulations ${to_name}!`
    : `🎟️ Your CalABA 2026 Raffle Tickets — ${ticket_count} Ticket${ticket_count > 1 ? 's' : ''}`;

  const ticketHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #0891b2); padding: 32px 24px; text-align: center;">
        <h1 style="color: #f59e0b; font-size: 14px; margin: 0 0 8px; letter-spacing: 2px;">CalABA 2026 CONFERENCE</h1>
        <h2 style="color: white; font-size: 28px; margin: 0;">${isCert ? '🏆 Winner Certificate' : '🎟️ Your Raffle Tickets'}</h2>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 18px; color: #1a1a1a;">Hi ${to_name},</p>
        ${isCert ? `
          <p style="font-size: 16px; color: #525252; line-height: 1.6;">
            Congratulations! You've won a prize at the CalABA 2026 Conference Raffle! 🎉
          </p>
          <p style="font-size: 14px; color: #525252;">Your certificate is attached. If your prize requires coordination with the donor, we'll connect you shortly.</p>
        ` : `
          <p style="font-size: 16px; color: #525252; line-height: 1.6;">
            Thank you for supporting CalABA! Here are your raffle ticket details:
          </p>
          <div style="background: #1e3a5f; border-radius: 10px; padding: 20px; margin: 20px 0; color: white;">
            <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.6);">TICKETS</p>
            <p style="margin: 0 0 16px; font-size: 28px; font-weight: 800;">${ticket_count} × ticket${ticket_count > 1 ? 's' : ''}</p>
            <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.6);">AMOUNT</p>
            <p style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #10b981;">$${amount}</p>
            <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.6);">TICKET ID${ticket_ids?.length > 1 ? 'S' : ''}</p>
            <p style="margin: 0; font-family: monospace; font-size: 13px; color: #f59e0b;">${(ticket_ids || []).join('<br>')}</p>
          </div>
          <p style="font-size: 14px; color: #525252;">Your ticket image is attached below. Please complete your PayPal payment if you haven't already.</p>
        `}
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>⚠️ Must Be Present to Win!</strong><br>
            March 5-7, 2026 • Sacramento Convention Center<br>
            Drawings begin at 5:30 PM during the reception
          </p>
        </div>
        <p style="font-size: 14px; color: #525252;">Thank you for supporting CalABA!</p>
      </div>
      <div style="background: #1e293b; padding: 16px 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">CalABA 2026 Conference • Sacramento, CA • <a href="https://calaba.org" style="color: #0891b2;">calaba.org</a></p>
      </div>
    </div>
  `;

  // Build attachments
  const attachments = [];
  if (ticket_image) {
    const base64Data = ticket_image.replace(/^data:image\/png;base64,/, '');
    attachments.push({
      filename: isCert ? `calaba-2026-certificate-${to_name.replace(/\s+/g, '-').toLowerCase()}.png` : `calaba-2026-raffle-ticket.png`,
      content: base64Data,
      encoding: 'base64',
      cid: 'ticket-image',
    });
  }

  try {
    await transporter.sendMail({
      from: `"CalABA 2026 Raffle" <${process.env.GMAIL_USER}>`,
      to: to_email,
      subject,
      html: ticketHtml + (ticket_image ? '<div style="text-align:center;margin:20px 0;"><img src="cid:ticket-image" style="max-width:100%;border-radius:12px;" /></div>' : ''),
      attachments,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
}
