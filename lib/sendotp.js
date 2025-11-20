import nodemailer from "nodemailer";

export const sendEmailOtp = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: "Your OTP for The Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #1a1828; color: white;">
        <div style="text-align: center; border-bottom: 1px solid #3e3b4a; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #a083f2; font-size: 24px;">The Prompt Index</h1>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">
            Thank you for creating an account with The Prompt Index. Please use the following One-Time Password (OTP) to complete your login.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 12px 24px; font-size: 24px; font-weight: bold; color: #fff; background-color: #a083f2; border-radius: 6px; letter-spacing: 2px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 16px; color: #aaa;">
            This OTP is valid for 5 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
          <p>This is an automated email, please do not reply.</p>
          <p>The Prompt Index © 2025</p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
