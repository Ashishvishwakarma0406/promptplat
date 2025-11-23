// app/api/user/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
  console.error("Missing JWT secret (JWT_SECRET or JWT_SECRET_KEY).");
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const input = (body.email || body.username || body.usernameEmail || "").trim();
    const password = body.password;
    if (!input || !password) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });
    }

    const isEmail = input.includes("@");
    const normalizedEmail = isEmail ? input.toLowerCase() : null;
    const usernameSearch = isEmail ? null : input;

    // find user (include password)
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: normalizedEmail }
        : { username: usernameSearch },
      select: { id: true, email: true, username: true, name: true, password: true }
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, email: user.email, username: user.username, name: user.name }
    }, { status: 200 });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      path: "/"
    });

    return response;
  } catch (err) {
    console.error("POST /api/user/login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // return current user if cookie exists
    // cookie helper not available here, use next/headers.cookies in other file (me route) if preferred
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    console.error("GET /api/user/login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
