// app/api/prompts/liked/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find likes for this user where the liked prompt is public + not deleted
    const liked = await prisma.like.findMany({
      where: {
        userId,
        prompt: {
          visibility: "public",
          isDeleted: false,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        prompt: {
          include: {
            owner: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
    });

    // Extract prompts only (filter in case of any nulls)
    const prompts = liked
      .map((l) => l.prompt)
      .filter(Boolean);

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (err) {
    console.error("GET /api/prompts/liked error:", err);
    return NextResponse.json(
      { error: "Failed to fetch liked prompts" },
      { status: 500 }
    );
  }
}
