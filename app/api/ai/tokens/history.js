// app/api/ai/tokens/history/route.js
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const txs = await prisma.tokenTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(txs, { status: 200 });
  } catch (err) {
    console.error("token history:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
