// app/api/user/send_register_otp/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import OTP from "@/models/otp";
import User from "@/models/user";
import { sendEmailOtp } from "@/lib/sendotp";
import { sanitizeString, isValidEmail, isValidUsername, isValidPassword } from "@/lib/validation";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { name, username, email, password } = body;
    if (!name || !username || !email || !password) return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    const sanitizedName = sanitizeString(name, 100);
    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(sanitizedEmail)) return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    if (!isValidUsername(sanitizedUsername)) return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    if (!isValidPassword(password)) return NextResponse.json({ error: "Invalid password" }, { status: 400 });

    await dbConnect();

    const existing = await User.findOne({ $or: [{ email: sanitizedEmail }, { username: sanitizedUsername }] }).lean();
    if (existing) return NextResponse.json({ error: "Email or username already registered" }, { status: 409 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
      { email: sanitizedEmail },
      { code: otp, createdAt: new Date() },
      { upsert: true }
    );

    try {
      await sendEmailOtp(sanitizedEmail, otp);
    } catch (err) {
      console.error("Failed to send OTP:", err);
      return NextResponse.json({ error: "Failed to send OTP. Check email configuration." }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (err) {
    console.error("send_register_otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
