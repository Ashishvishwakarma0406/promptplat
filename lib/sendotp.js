// lib/sendotp.js
import nodemailer from "nodemailer";

const {
  MAIL_USER,
  MAIL_PASS,
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "465",
  SMTP_SECURE = "true",
  FROM_NAME = "PromptPlat",
  FROM_EMAIL = undefined,
} = process.env;

const effectiveFromEmail = MAIL_USER || FROM_EMAIL || `no-reply@${process.env.NEXT_PUBLIC_SITE_DOMAIN || "promptplat.local"}`;

let transporter = null;
let transporterReady = false;

async function initTransporter() {
  if (transporterReady) return transporter;
  transporterReady = true;

  if (!MAIL_USER || !MAIL_PASS) {
    console.warn("sendotp: MAIL_USER or MAIL_PASS not set — falling back to console logging for OTPs");
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
    connectionTimeout: 10_000,
  });

  try {
    await transporter.verify();
    console.log("sendotp: SMTP verified");
  } catch (err) {
    console.error("sendotp: SMTP verify failed:", err?.message || err);
    transporter = null;
  }

  return transporter;
}

/**
 * Send OTP email. If SMTP is not configured, falls back to logging the OTP (dev mode).
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit code
 * @returns {Promise<object>} info or dev message
 */
export async function sendEmailOtp(to, otp) {
  await initTransporter();

  // Dev fallback (no SMTP configured)
  if (!transporter) {
    const msg = `[DEV OTP] to=${to} code=${otp}`;
    console.log(msg);
    return { dev: true, message: msg };
  }

  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Verify your ${FROM_NAME} account</title>
    </head>
    <body style="margin:0;padding:0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;">
      <div style="max-width:600px;margin:32px auto;background:#0f1724;color:#e6eef8;border-radius:10px;overflow:hidden;border:1px solid #111827">
        <div style="background:linear-gradient(90deg,#7c3aed,#9333ea);padding:20px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:20px">${FROM_NAME}</h1>
        </div>
        <div style="padding:28px 22px;background:#0b1220">
          <p style="margin:0 0 12px 0;color:#cbd5e1;font-size:15px">Use this code to verify your account:</p>
          <div style="text-align:center;margin:20px 0;">
            <span style="display:inline-block;padding:14px 26px;background:#0b1220;border:1px solid #1f2937;border-radius:8px;font-family:monospace;font-size:22px;color:#c4b5fd;letter-spacing:4px;">
              ${otp}
            </span>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:13px">This code is valid for 10 minutes. If you did not request this, ignore the email.</p>
        </div>
        <div style="background:#071025;padding:12px;text-align:center;color:#6b7280;font-size:12px">
          &copy; ${new Date().getFullYear()} ${FROM_NAME}
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${FROM_NAME}" <${effectiveFromEmail}>`,
    to,
    subject: `${FROM_NAME} — Your verification code`,
    text: `Your verification code for ${FROM_NAME} is: ${otp}. It expires in 10 minutes.`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("sendotp: email sent to", to, "messageId:", info.messageId);
    return { success: true, info };
  } catch (err) {
    console.error("sendotp: sendMail error:", err?.message || err);
    throw new Error("Failed to send OTP email");
  }
}

export default sendEmailOtp;
