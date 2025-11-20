// lib/sendotp.js
import nodemailer from "nodemailer";

const {
  MAIL_USER,
  MAIL_PASS,
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = 465,
  SMTP_SECURE = "true",
  FROM_NAME = "PromptPlat",
  FROM_EMAIL = MAIL_USER,
} = process.env;

if (!MAIL_USER || !MAIL_PASS) {
  console.error("MAIL_USER or MAIL_PASS not set");
}

const transporter = MAIL_USER && MAIL_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === "true",
      auth: { user: MAIL_USER, pass: MAIL_PASS },
      connectionTimeout: 10000,
    })
  : null;

if (transporter) {
  transporter.verify()
    .then(() => console.log("SMTP verified"))
    .catch(err => {
      console.error("SMTP verify failed:", err);
    });
}

export async function sendEmailOtp(to, otp) {
  if (!transporter) {
    const msg = `DEV OTP for ${to}: ${otp}`;
    console.log(msg);
    return { dev: true, message: msg };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;background:#0f0e14;color:#fff;padding:20px;border-radius:8px;max-width:600px;margin:auto">
      <div style="text-align:center;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <h2 style="color:#a083f2;margin:0">${FROM_NAME}</h2>
      </div>
      <div style="padding:18px 0">
        <p style="margin:0 0 8px 0">Use the following OTP to complete your Signup:</p>
        <div style="text-align:center;margin:18px 0">
          <span style="display:inline-block;padding:12px 20px;background:#a083f2;border-radius:6px;font-size:20px;font-weight:700;color:#fff;letter-spacing:2px">
            ${otp}
          </span>
        </div>
        <p style="margin:0;color:#bfbfbf;font-size:13px">This OTP is valid for 10 minutes.</p>
      </div>
      <div style="text-align:center;margin-top:14px;font-size:12px;color:#9a9a9a">
        <p style="margin:0">This is an automated message — do not reply.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Your verification code",
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("sendEmailOtp error:", err);
    throw err;
  }
}
