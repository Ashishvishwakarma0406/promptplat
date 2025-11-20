// app/api/user/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbconnect";
import User from "@/models/user";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || null;
const attempts = global.__loginAttempts || new Map();
global.__loginAttempts = attempts;
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 10 * 60 * 1000;

function rateLimit(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry) {
    if (now - entry.timestamp < BLOCK_TIME) {
      if (entry.count >= MAX_ATTEMPTS) return true;
      entry.count++;
      attempts.set(key, entry);
      return false;
    } else {
      attempts.set(key, { count: 1, timestamp: now });
      return false;
    }
  }
  attempts.set(key, { count: 1, timestamp: now });
  return false;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const inputRaw = (body.email || body.usernameEmail || body.username || body.login || "").trim();
    const password = body.password;
    if (!inputRaw || !password) return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });

    if (!JWT_SECRET) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    if (rateLimit(inputRaw)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

    const isEmail = inputRaw.includes("@");
    const normalizedEmail = isEmail ? inputRaw.toLowerCase().trim() : null;
    const usernameSearch = isEmail ? null : inputRaw.trim();

    const or = [];
    if (normalizedEmail) {
      or.push({ email: normalizedEmail });
      or.push({ email: { $regex: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i") } });
      or.push({ username: normalizedEmail });
    }
    if (usernameSearch) {
      or.push({ username: { $regex: new RegExp(`^${escapeRegExp(usernameSearch)}$`, "i") } });
      or.push({ email: { $regex: new RegExp(`^${escapeRegExp(usernameSearch)}$`, "i") } });
    }

    if (!or.length) return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });

    const user = await User.findOne({ $or: or }).select("+password").lean();
    if (!user) return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });

    const match = await bcrypt.compare(password, user.password).catch((e) => { console.error("bcrypt error:", e); return false; });
    if (!match) return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, email: user.email, username: user.username, name: user.name },
    }, { status: 200 });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
