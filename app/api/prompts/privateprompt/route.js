// app/api/prompts/privateprompt/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerIdParam = searchParams.get("owner");
    const authUserId = await getUserIdFromRequest(request);
    if (!authUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let userIdToQuery = authUserId;
    if (ownerIdParam) {
      if (ownerIdParam !== authUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      userIdToQuery = ownerIdParam;
    }

    const prompts = await prisma.prompt.findMany({
      where: { ownerId: userIdToQuery, visibility: "private", isDeleted: false },
      include: { owner: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (err) {
    console.error("GET /api/prompts/privateprompt error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
