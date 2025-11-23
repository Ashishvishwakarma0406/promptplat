// app/api/user/update-profile/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { email, password, name } = body;
    if (!email || !password || !name) return NextResponse.json({ error: "Email, password, and name are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "Invalid password." }, { status: 401 });

    const updated = await prisma.user.update({
      where: { email },
      data: { name },
      select: { email: true, name: true },
    });

    return NextResponse.json({ message: "Profile updated successfully.", user: updated }, { status: 200 });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
