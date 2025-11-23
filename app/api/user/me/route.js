// app/api/user/me/route.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET");
      return Response.json({ user: null }, { status: 500 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return Response.json({ user: null }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return Response.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      },
    });

    if (!user) return Response.json({ user: null }, { status: 404 });

    return Response.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/user/me:", err);
    return Response.json({ user: null }, { status: 500 });
  }
}
