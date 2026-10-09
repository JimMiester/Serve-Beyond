import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend's shared sandbox sender works with no setup, but in that mode it
// can only deliver to the Resend account's own verified email — swap in a
// real "from" address (RESEND_FROM_EMAIL) once a sending domain is
// verified in the Resend dashboard, so it can reach any player's inbox.
const FROM = process.env.RESEND_FROM_EMAIL || "Serve & Beyond <onboarding@resend.dev>";

export async function sendBookingConfirmationEmail(params: {
  to: string;
  courtName: string;
  programTitle: string;
  date: string;
  timeLabel: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping booking confirmation email.");
    return;
  }

  const { to, courtName, programTitle, date, timeLabel } = params;

  // A failed send should never undo or block an already-successful
  // booking, so this is fire-and-forget from the caller's perspective —
  // errors are logged, not thrown.
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Booking confirmed — Serve & Beyond Tennis Academy",
      html: `
        <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 20px; margin-bottom: 8px;">Booking confirmed</h1>
          <p style="color: #555; margin-top: 0;">We&rsquo;ll see you on the court. Here are your session details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #777; border-top: 1px solid #eee;">Court</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${courtName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #777; border-top: 1px solid #eee;">Date</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #777; border-top: 1px solid #eee;">Time</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${timeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #777; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">Programme</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">${programTitle}</td>
            </tr>
          </table>
        </div>
      `,
    });
    if (error) console.error("Failed to send booking confirmation email:", error);
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
  }
}
