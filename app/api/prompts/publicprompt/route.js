// app/api/prompts/publicprompt/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  sanitizeSearchQuery,
  sanitizeString,
} from "@/lib/validation"; // optional safe sanitizers

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const rawQ = sanitizeSearchQuery(
      (searchParams.get("q") || "").trim()
    );

    const category = sanitizeString(
      (searchParams.get("category") || "").trim(),
      50
    );

    const sort = (searchParams.get("sort") || "recent").toLowerCase();
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const cursor = Math.max(parseInt(searchParams.get("cursor") || "0", 10), 0);
    const sample = searchParams.get("sample");

    const baseWhere = {
      visibility: "public",
      isDeleted: false,
    };

    /* ---------------------------------------------------
     *  SAMPLE MODE → Random Prompts (first paint)
     * --------------------------------------------------- */
    if (
      (sample === "1" || sample === "true") &&
      !rawQ &&
      !category &&
      cursor === 0
    ) {
      const rows = await prisma.$queryRaw`
        SELECT *
        FROM "Prompt"
        WHERE "visibility" = 'public' AND "isDeleted" = false
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;

      // Attach owner info manually
      const items = await Promise.all(
        rows.map(async (r) => {
          const owner = await prisma.user.findUnique({
            where: { id: r.ownerId },
            select: { id: true, name: true, username: true },
          });
          return { ...r, owner };
        })
      );

      const total = await prisma.prompt.count({ where: baseWhere });

      return NextResponse.json(
        {
          prompts: items,
          total,
          nextCursor: limit,
          hasMore: total > limit,
        },
        { status: 200 }
      );
    }

    /* ---------------------------------------------------
     *  NORMAL SEARCH / FILTER / PAGINATION
     * --------------------------------------------------- */
    const where = { ...baseWhere };

    if (rawQ) {
      where.title = {
        contains: rawQ,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    const orderBy =
      sort === "likes"
        ? [{ likesCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy,
        skip: cursor,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, username: true } },
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return NextResponse.json(
      {
        prompts: items,
        total,
        nextCursor: cursor + items.length,
        hasMore: cursor + items.length < total,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/prompts/publicprompt error:", err);
    return NextResponse.json(
      { error: "Failed to fetch public prompts" },
      { status: 500 }
    );
  }
}
