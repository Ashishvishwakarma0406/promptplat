// app/api/user/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const inputRaw = String(body.email || body.username || body.usernameEmail || "").trim();
    const password = String(body.password || "");

    if (!inputRaw || !password) {
      return NextResponse.json({ error: "Email/username and password required" }, { status: 400 });
    }

    const isEmail = inputRaw.includes("@");
    const normalizedEmail = isEmail ? inputRaw.toLowerCase() : null;
    const usernameSearch = isEmail ? null : inputRaw;

    // Find user (email stored lowercase)
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, email: true, username: true, name: true, password: true } })
      : await prisma.user.findUnique({ where: { username: usernameSearch }, select: { id: true, email: true, username: true, name: true, password: true } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });

    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    const resp = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, name: user.name },
    }, { status: 200 });

    resp.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return resp;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
