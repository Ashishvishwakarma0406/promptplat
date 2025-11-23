// lib/sendotp.js
import nodemailer from "nodemailer";

const {
  MAIL_USER,
  MAIL_PASS,
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = 465,
  SMTP_SECURE = "true",
  FROM_NAME = "PromptPlat",
  FROM_EMAIL = MAIL_USER || process.env.FROM_EMAIL,
} = process.env;

let transporter = null;
let transporterInitialized = false;

async function initTransporter() {
  if (transporterInitialized) return transporter;
  transporterInitialized = true;

  if (!MAIL_USER || !MAIL_PASS) {
    console.warn("MAIL_USER or MAIL_PASS not set — falling back to DEV logging for OTPs");
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: { user: MAIL_USER, pass: MAIL_PASS },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log("SMTP verified");
  } catch (err) {
    console.error("SMTP verify failed:", err);
    transporter = null; // Reset to allow retry or fallback
  }

  return transporter;
}

export async function sendEmailOtp(to, otp) {
  await initTransporter();

  // Fallback for Development/Missing Credentials
  if (!transporter) {
    const msg = `[DEV MODE] OTP for ${to}: ${otp}`;
    console.log("\x1b[33m%s\x1b[0m", msg); // Yellow log for visibility
    return { dev: true, message: msg };
  }

  // Updated Email Design & Content
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your PromptPlat Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #e4e4e7;">
      
      <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border-radius: 12px; border: 1px solid #27272a; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        
        <div style="background: linear-gradient(90deg, #7c3aed 0%, #9333ea 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">PromptPlat</h1>
        </div>

        <div style="padding: 32px 24px;">
          <h2 style="margin-top: 0; color: #f4f4f5; font-size: 20px; text-align: center;">Unlock your creativity</h2>
          
          <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
            Welcome to the community! You are just one step away from discovering, sharing, and curating the best AI prompts on the web.
          </p>

          <p style="color: #e4e4e7; font-size: 14px; text-align: center; margin-bottom: 12px;">
            Please enter the following verification code to complete your signup:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 16px 32px; background-color: #27272a; border: 1px solid #3f3f46; border-radius: 8px; font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; color: #a78bfa; letter-spacing: 4px;">
              ${otp}
            </span>
          </div>

          <p style="text-align: center; color: #71717a; font-size: 13px; margin-top: 24px;">
            This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.
          </p>
        </div>

        <div style="background-color: #121212; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
          <p style="margin: 0; color: #52525b; font-size: 12px;">
            &copy; ${new Date().getFullYear()} PromptPlat. All rights reserved.
          </p>
          <p style="margin: 5px 0 0 0; color: #52525b; font-size: 12px;">
            Elevating AI interaction, one prompt at a time.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `Verify your ${FROM_NAME} account`,
    html,
    text: `Welcome to PromptPlat! Your verification code is: ${otp}. It expires in 10 minutes.`, // Plain text fallback
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent to:", to, "| MessageID:", info.messageId);
    return { success: true, info };
  } catch (err) {
    console.error("sendEmailOtp error:", err);
    throw new Error(`Failed to send OTP email: ${err.message}`);
  }
}