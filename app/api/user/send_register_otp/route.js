// app/api/user/send_register_otp/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailOtp } from "@/lib/sendotp";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or username already registered" },
        { status: 409 }
      );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await prisma.oTP.upsert({
      where: { email },
      update: { code: otp, createdAt: new Date() },
      create: { email, code: otp },
    });

    await sendEmailOtp(email, otp);

    return NextResponse.json({ message: "OTP sent" }, { status: 200 });
  } catch (err) {
    console.error("send_register_otp:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
