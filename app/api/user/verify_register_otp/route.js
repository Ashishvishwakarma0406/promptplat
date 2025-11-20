
// app/api/user/verify_register_otp/route.js
import dbConnect from "../../../../lib/dbconnect";
import OTP from "../../../../models/otp";
import User from "../../../../models/user";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, otp, name, username, password } = await req.json();

    if (!email || !otp || !name || !username || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Input validation
    const { sanitizeString, isValidEmail, isValidUsername, isValidPassword } = await import("@/lib/validation");
    
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedUsername = username.trim();
    const sanitizedOtp = otp.trim();

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

    if (!/^\d{6}$/.test(sanitizedOtp)) {
      return Response.json({ error: "OTP must be 6 digits" }, { status: 400 });
    }

    await dbConnect();

    // Find OTP for this email
    const match = await OTP.findOne({ email: sanitizedEmail });
    if (!match) {
      return Response.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    // Check if OTP is expired (TTL index handles deletion, but verify timestamp too)
    const otpAge = Date.now() - new Date(match.createdAt).getTime();
    const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
    if (otpAge > OTP_EXPIRY_MS) {
      await OTP.deleteOne({ email: sanitizedEmail }); // Clean up expired OTP
      return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 401 });
    }

    if (match.code !== sanitizedOtp) {
      return Response.json({ error: "Invalid OTP" }, { status: 401 });
    }

    // Check if user already exists
    let user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await User.create({
        name: sanitizedName,
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword,
      });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      return Response.json(
        { error: "JWT_SECRET not configured" },
        { status: 500 }
      );
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Save token in HTTP-only cookie
    cookies().set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    // Delete OTP after use
    await OTP.deleteOne({ email: sanitizedEmail });

    return Response.json(
      { message: "User registered successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in verify-register-otp:", error);
    return Response.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
