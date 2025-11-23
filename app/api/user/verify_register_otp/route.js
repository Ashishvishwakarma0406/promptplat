// app/api/user/verify_register_otp/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { email, otp, name, username, password } = body;

    if (!email || !otp || !name || !username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const record = await prisma.oTP.findUnique({ where: { email } });

    if (!record) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });

    if (record.code !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
    });

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    await prisma.oTP.delete({ where: { email } });

    return NextResponse.json({ message: "User registered successfully" }, { status: 200 });
  } catch (err) {
    console.error("verify_register_otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
