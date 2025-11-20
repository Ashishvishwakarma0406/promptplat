// app/api/user/verify_register_otp/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import OTP from "@/models/otp";
import User from "@/models/user";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sanitizeString, isValidEmail, isValidUsername, isValidPassword } from "@/lib/validation";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { email, otp, name, username, password } = body;
    if (!email || !otp || !name || !username || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedUsername = username.trim();
    const sanitizedOtp = otp.trim();

    if (!isValidEmail(sanitizedEmail)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (!isValidUsername(sanitizedUsername)) return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    if (!isValidPassword(password)) return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    if (!/^\d{6}$/.test(sanitizedOtp)) return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });

    await dbConnect();

    const match = await OTP.findOne({ email: sanitizedEmail }).lean();
    if (!match) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });

    const otpAge = Date.now() - new Date(match.createdAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
      await OTP.deleteOne({ email: sanitizedEmail });
      return NextResponse.json({ error: "OTP expired" }, { status: 401 });
    }

    if (match.code !== sanitizedOtp) return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });

    let user = await User.findOne({ email: sanitizedEmail }).select("+password").exec();
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await User.create({
        name: sanitizedName,
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword,
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    cookies().set("token", token, { httpOnly: true, path: "/", maxAge: 7 * 24 * 60 * 60 });

    await OTP.deleteOne({ email: sanitizedEmail });

    return NextResponse.json({ message: "User registered successfully" }, { status: 200 });
  } catch (err) {
    console.error("verify_register_otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
