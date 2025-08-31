// supabase/functions/booking-email/index.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "npm:qrcode";

// Env
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOOKING_WEBHOOK_SECRET = Deno.env.get("BOOKING_WEBHOOK_SECRET")!;
const GMAIL_SENDER_EMAIL = Deno.env.get("GMAIL_SENDER_EMAIL")!;
const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID")!;
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET")!;
const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN")!;
const TICKETS_BUCKET = Deno.env.get("TICKETS_BUCKET") || "tickets";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// helpers
function requireHeader(req: Request, name: string, expected: string) {
  const got = req.headers.get(name);
  if (!got || got !== expected) throw new Error(`Unauthorized: missing/invalid ${name}`);
}
function nowISO() { return new Date().toISOString(); }
function base64UrlEncode(str: string) {
  // Convert UTF-8 string to bytes first, then to base64
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64FromDataURL(dataUrl: string){ return dataUrl.split(",")[1] ?? ""; }

// OAuth: Exchange refresh token -> access token for Gmail API
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to get access token: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

// Build RFC2822 raw email with attachments (attendee QR images)
function buildRawEmail({ fromName = "EventHive", fromEmail, toEmail, subject, plainText, html, attachments }:
  { fromName?: string, fromEmail: string, toEmail: string, subject: string, plainText: string, html: string, attachments?: Array<{filename:string,mime:string,contentBase64:string,contentId?:string}> }) {

  // boundary
  const boundary = "====BOUNDARY_" + crypto.randomUUID();
  const boundaryAlt = "====ALT_" + crypto.randomUUID();

  // Encode non-ASCII for headers per RFC 2047
  function encodeMimeWord(s: string) {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return `=?UTF-8?B?${b64}?=`;
  }

  let lines: string[] = [];
  lines.push(`From: ${encodeMimeWord(safeString(fromName))} <${safeString(fromEmail)}>`);
  lines.push(`To: ${safeString(toEmail)}`);
  lines.push(`Subject: ${encodeMimeWord(safeString(subject))}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
  lines.push("");
  // plain text part
  lines.push(`--${boundaryAlt}`);
  lines.push(`Content-Type: text/plain; charset="UTF-8"`); // Ensure UTF-8 encoding
  lines.push(`Content-Transfer-Encoding: quoted-printable`); // Use quoted-printable encoding for special characters
  lines.push(encodeQuotedPrintable(plainText));
  lines.push("");
  // html part
  lines.push(`--${boundaryAlt}`);
  lines.push(`Content-Type: text/html; charset="UTF-8"`); // Ensure UTF-8 encoding
  lines.push(`Content-Transfer-Encoding: quoted-printable`); // Use quoted-printable encoding for special characters
  lines.push(encodeQuotedPrintable(html));
  lines.push("");
  lines.push(`--${boundaryAlt}--`);
  lines.push("");

  // attachments
  if (attachments && attachments.length) {
    for (const att of attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.mime}; name="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push(`Content-Disposition: inline; filename="${att.filename}"`);
      if (att.contentId) {
        lines.push(`Content-ID: <${att.contentId}>`);
      }
      lines.push("");
      // Ensure chunked base64 lines of 76 chars (not strictly required but friendly)
      const b = att.contentBase64;
      for (let i=0;i<b.length;i+=76) lines.push(b.slice(i,i+76));
      lines.push("");
    }
  }

  lines.push(`--${boundary}--`);
  const raw = lines.join("\r\n");
  return base64UrlEncode(raw);
}

// Small helper to create minimal HTML for email
function buildHTML(event: any, purchaserName: string|null, attendees: Array<{name:string,qrBase64:string}>) {
  const attendeeBlocks = attendees.map(a=>`
    <div style="margin-bottom:12px;">
      <div style="font-weight:600">${a.name}</div>
      <img src="cid:${a.name.replace(/\s/g,'_')}-qr" alt="QR for ${a.name}" />
    </div>
  `).join("");
  return `
    <div>
      <h2>${event.title}</h2>
      <div><b>Date:</b> ${event.event_date}</div>
      <div><b>Time:</b> ${event.event_time}</div>
      <div><b>Location:</b> ${event.location}</div>
      <p>Hi ${purchaserName||''}, your tickets are attached below. Show the QR at entry.</p>
      ${attendeeBlocks}
      <hr/>
      <div style="font-size:12px;color:#666">Each QR is single use.</div>
    </div>
  `;
}

// Helper function to encode quoted-printable
// Proper quoted-printable encoder for UTF-8
function encodeQuotedPrintable(input: string): string {
  const encoder = new TextEncoder(); // encodes to UTF-8 bytes
  const bytes = encoder.encode(input);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Printable ASCII except "=" must stay as-is
    if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126) || b === 9 || b === 32) {
      out += String.fromCharCode(b);
    } else if (b === 61) { // "=" must be escaped
      out += "=3D";
    } else {
      out += "=" + b.toString(16).toUpperCase().padStart(2, "0");
    }
  }
  return out;
}

// Safe string normalization
function safeString(str: string) {
  return str ? str.normalize("NFKC") : "";
}

serve(async (req: Request) => {
  try {
    // verify webhook secret header
    requireHeader(req, "x-webhook-secret", BOOKING_WEBHOOK_SECRET);

    const payload = await req.json(); // db webhook default has record
    const record = payload?.record ?? (payload?.booking_id ? {id: payload.booking_id} : null);
    if (!record || !record.id) return new Response(JSON.stringify({ ok:false, error:'no-record' }), { status: 400 });

    // fetch booking
    const { data: booking, error: bkErr } = await supabase.from("bookings").select("*").eq("id", record.id).single();
    if (bkErr || !booking) throw new Error(`Booking not found (${bkErr?.message})`);
    // only send for confirmed bookings
    if (booking.booking_status !== "confirmed") return new Response(JSON.stringify({ ok:true, skipped:"not-confirmed" }), { status: 200 });

    // event + user + attendees
    const [{ data: event, error: eErr }, { data: user, error: uErr }] = await Promise.all([
      supabase.from("events").select("*").eq("id", booking.event_id).single(),
      supabase.from("users").select("*").eq("id", booking.user_id).single()
    ]);
    if (eErr || !event) throw new Error(`Event not found: ${eErr?.message}`);
    if (uErr || !user) throw new Error(`User not found: ${uErr?.message}`);

    // Generate a booking-level QR code
    const qrPayload = {
      booking_id: safeString(booking.id),
      user_id: safeString(user.id),
      event_id: safeString(event.id),
      quantity: booking.quantity
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      type: "image/png",
      errorCorrectionLevel: "H"
    });
    const qrBase64 = base64FromDataURL(qrDataUrl);

    // Build HTML and plain text email content
    const html = `
      <div>
        <h2>${safeString(event.title)}</h2>
        <div><b>Date:</b> ${safeString(event.event_date)}</div>
        <div><b>Time:</b> ${safeString(event.event_time)}</div>
        <div><b>Location:</b> ${safeString(event.location)}</div>
        <p>Hi ${safeString(user.name) || 'Guest'},</p>
        <p>Your booking is confirmed for ${booking.quantity} ticket(s). Please find your QR code below:</p>
        <img src="cid:booking-qr" alt="Booking QR Code" />
        <hr/>
        <div style="font-size:12px;color:#666">This QR code is valid for the entire booking.</div>
      </div>
    `;
  const plainText = `Your booking for ${safeString(event.title)} is confirmed. Quantity: ${booking.quantity}.`;

    // Build raw email with the QR code as an attachment
    const raw = buildRawEmail({
      fromName: "EventHive",
      fromEmail: safeString(GMAIL_SENDER_EMAIL),
      toEmail: safeString(user.email),
      subject: safeString(`Your tickets • ${event.title}`),
      plainText: safeString(plainText),
      html: safeString(html),
      attachments: [
        {
          filename: `booking-${safeString(booking.id)}.png`,
          mime: "image/png",
          contentBase64: qrBase64,
          contentId: "booking-qr"
        }
      ]
    });

    // Send via Gmail API
    const accessToken = await getAccessToken();
    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw })
    });

    if (!sendRes.ok) {
      const t = await sendRes.text();
      throw new Error(`Gmail send failed ${sendRes.status}: ${t}`);
    }

    // Update bookings table to mark tickets as emailed
    await supabase.from("bookings").update({ tickets_emailed_at: nowISO() }).eq("id", booking.id);
    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      event_id: booking.event_id,
      type: "ticket_email_sent",
      message: `Tickets emailed for booking ${booking.booking_reference}`,
      read: false,
      created_at: nowISO()
    });

    // Debug step: Log the data being sent in the response
    console.log("Response data:", JSON.stringify({ ok: true }));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err:any) {
    console.error("booking-email error:", err?.message || err);
    return new Response(
      JSON.stringify({ ok:false, error: err?.message || "error" }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
});
