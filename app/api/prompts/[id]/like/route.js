// app/api/prompts/[id]/like/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export const runtime = "nodejs";

/**
 * Helper: extract prompt id from request URL path.
 * Works for routes like /api/prompts/{id}/like
 */
function extractPromptIdFromUrl(req) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean); // ['api','prompts','{id}','like']
    const promptsIndex = parts.indexOf("prompts");
    if (promptsIndex === -1) return null;
    return parts[promptsIndex + 1] ?? null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const promptId = extractPromptIdFromUrl(req);
    if (!promptId) return NextResponse.json({ error: "Invalid prompt id" }, { status: 400 });

    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, visibility: true, likesCount: true },
    });
    if (!prompt || prompt.visibility !== "public" || prompt.isDeleted) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Try create like; if unique violation -> remove like (toggle)
    try {
      await prisma.like.create({ data: { userId, promptId } });
      const after = await prisma.prompt.update({
        where: { id: promptId },
        data: { likesCount: { increment: 1 } },
        select: { likesCount: true },
      });
      return NextResponse.json({ liked: true, likes: after.likesCount }, { status: 200 });
    } catch (err) {
      // Prisma unique constraint is P2002
      if (err?.code === "P2002") {
        // unlike: delete the like record
        const del = await prisma.like.deleteMany({ where: { userId, promptId } });
        if (del.count === 1) {
          const after = await prisma.prompt.update({
            where: { id: promptId },
            data: { likesCount: { decrement: 1 } },
            select: { likesCount: true },
          });
          const likes = Math.max(after.likesCount, 0);
          if (after.likesCount < 0) {
            // clamp to zero (defensive)
            await prisma.prompt.update({ where: { id: promptId }, data: { likesCount: 0 } });
            return NextResponse.json({ liked: false, likes: 0 }, { status: 200 });
          }
          return NextResponse.json({ liked: false, likes }, { status: 200 });
        } else {
          // nothing deleted for some reason — return current value
          const current = await prisma.prompt.findUnique({ where: { id: promptId }, select: { likesCount: true } });
          return NextResponse.json({ liked: true, likes: current?.likesCount ?? 0 }, { status: 200 });
        }
      }
      throw err;
    }
  } catch (e) {
    console.error("POST /api/prompts/[id]/like error:", e);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const promptId = extractPromptIdFromUrl(req);
    if (!promptId) return NextResponse.json({ error: "Invalid prompt id" }, { status: 400 });

    const userId = await getUserIdFromRequest(req); // may be null

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, visibility: true, likesCount: true, isDeleted: true },
    });
    if (!prompt || prompt.visibility !== "public" || prompt.isDeleted) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    let liked = false;
    if (userId) {
      // use compound unique name from your schema: user_prompt_unique
      const like = await prisma.like.findUnique({
        where: { user_prompt_unique: { userId, promptId } },
      }).catch(() => null);
      liked = !!like;
    }

    return NextResponse.json({ likes: Math.max(prompt.likesCount || 0, 0), liked }, { status: 200 });
  } catch (e) {
    console.error("GET /api/prompts/[id]/like error:", e);
    return NextResponse.json({ error: "Failed to load like status" }, { status: 500 });
  }
}
