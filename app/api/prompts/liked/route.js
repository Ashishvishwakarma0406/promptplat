// app/api/prompts/liked/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const liked = await prisma.like.findMany({
      where: {},
      include: {
        prompt: {
          where: { visibility: "public", isDeleted: false },
          include: { owner: { select: { id: true, name: true, username: true } } },
        },
      },
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const prompts = liked.map((l) => l.prompt).filter(Boolean);
    return NextResponse.json({ prompts }, { status: 200 });
  } catch (e) {
    console.error("GET /api/prompts/liked error:", e);
    return NextResponse.json({ error: "Failed to fetch liked prompts" }, { status: 500 });
  }
}
