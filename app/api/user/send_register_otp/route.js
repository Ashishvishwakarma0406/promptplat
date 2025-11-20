
// app/api/user/send_register_otp/route.js
import dbConnect from "../../../../lib/dbconnect";
import OTP from "../../../../models/otp";
import User from "../../../../models/user";
import { sendEmailOtp } from "../../../../lib/sendotp";

export async function POST(req) {
  try {
    const { name, username, email, password } = await req.json();

    if (!name || !username || !email || !password) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    // Input validation and sanitization
    const { sanitizeString, isValidEmail, isValidUsername, isValidPassword } = await import("@/lib/validation");
    
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(sanitizedEmail)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!isValidUsername(sanitizedUsername)) {
      return Response.json(
        { error: "Username must be 3-30 characters, alphanumeric with underscores or hyphens" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return Response.json(
        { error: "Password must be at least 8 characters and contain both letters and numbers" },
        { status: 400 }
      );
    }

    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return Response.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if email or username already exists
    const existing = await User.findOne({ $or: [{ email: sanitizedEmail }, { username: sanitizedUsername }] });
    if (existing) {
      return Response.json(
        { error: "Email or username already registered" },
        { status: 409 }
      );
    }

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in DB (upsert to overwrite if exists)
    await OTP.findOneAndUpdate(
      { email: sanitizedEmail },
      { code: otp, createdAt: new Date() },
      { upsert: true }
    );

    // Send OTP via email
    await sendEmailOtp(sanitizedEmail, otp);

    return Response.json(
      { message: "OTP sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in send-register-otp:", error);
    return Response.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
