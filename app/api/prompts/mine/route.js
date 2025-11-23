// app/api/prompts/mine/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prompts = await prisma.prompt.findMany({
      where: { ownerId: userId, isDeleted: false },
      include: { owner: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (err) {
    console.error("GET /api/prompts/mine error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
