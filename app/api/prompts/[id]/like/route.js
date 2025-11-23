// app/api/prompts/[id]/like/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export const runtime = "nodejs";

export async function POST(req, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pid = params.id;
    const prompt = await prisma.prompt.findUnique({ where: { id: pid } });
    if (!prompt || prompt.visibility !== "public" || prompt.isDeleted) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });

    try {
      // try create like
      await prisma.like.create({ data: { userId, promptId: pid } });
      const after = await prisma.prompt.update({ where: { id: pid }, data: { likesCount: { increment: 1 } } });
      return NextResponse.json({ liked: true, likes: after.likesCount }, { status: 200 });
    } catch (err) {
      // unique violation -> already liked => unlike
      const code = err?.code || err?.meta?.cause;
      // Prisma unique constraint code is P2002
      if (err?.code === "P2002") {
        const del = await prisma.like.deleteMany({ where: { userId, promptId: pid } });
        if (del.count === 1) {
          const after = await prisma.prompt.update({
            where: { id: pid },
            data: { likesCount: { decrement: 1 } },
          });
          const likes = Math.max(after.likesCount, 0);
          if (after.likesCount < 0) {
            await prisma.prompt.update({ where: { id: pid }, data: { likesCount: 0 } });
            return NextResponse.json({ liked: false, likes: 0 }, { status: 200 });
          }
          return NextResponse.json({ liked: false, likes }, { status: 200 });
        }
        const current = await prisma.prompt.findUnique({ where: { id: pid } });
        return NextResponse.json({ liked: true, likes: current?.likesCount ?? 0 }, { status: 200 });
      }
      throw err;
    }
  } catch (e) {
    console.error("POST /api/prompts/[id]/like error:", e);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    const pid = params.id;
    const prompt = await prisma.prompt.findUnique({ where: { id: pid } });
    if (!prompt || prompt.visibility !== "public" || prompt.isDeleted) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });

    let liked = false;
    if (userId) {
      const like = await prisma.like.findUnique({ where: { userId_promptId: { userId, promptId: pid } } }).catch(() => null);
      liked = !!like;
    }

    return NextResponse.json({ likes: Math.max(prompt.likesCount || 0, 0), liked }, { status: 200 });
  } catch (e) {
    console.error("GET /api/prompts/[id]/like error:", e);
    return NextResponse.json({ error: "Failed to load like status" }, { status: 500 });
  }
}
