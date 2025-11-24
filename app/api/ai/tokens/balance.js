// app/api/ai/tokens/balance/route.js
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const account = await prisma.tokenAccount.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ tokens: Number(account?.tokens ?? 0), activePlan: null }, { status: 200 });
  } catch (err) {
    console.error("GET tokens balance:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
