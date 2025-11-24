// app/api/user/me/route.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET");
      return NextResponse.json({ user: null }, { status: 500 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    if (!decoded?.id) return NextResponse.json({ user: null }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true, name: true },
    });

    if (!user) return NextResponse.json({ user: null }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/user/me:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
