// app/api/ai/humanizer/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/authHelper";
import { estimateTokensForText } from "@/lib/tokenUtils";

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body?.text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const input = String(body.text);
    const inputTokens = BigInt(estimateTokensForText(input));
    // Mock output tokens equal to input tokens for now
    const outputTokens = inputTokens;
    const total = inputTokens + outputTokens;

    // Transactionally check balance and deduct
    const result = await prisma.$transaction(async (tx) => {
      const acc = await tx.tokenAccount.findUnique({ where: { userId: user.id }, select: { tokens: true } });
      const current = BigInt(acc?.tokens ?? 0n);
      if (current < total) throw new Error("Insufficient tokens");

      await tx.tokenAccount.update({ where: { userId: user.id }, data: { tokens: { decrement: total } } });

      await tx.tokenTransaction.create({
        data: { userId: user.id, amount: -total, type: "AI_USAGE", reference: null, meta: { feature: "HUMANIZER", inputTokens: Number(inputTokens), outputTokens: Number(outputTokens) } },
      });

      await tx.aiUsage.create({
        data: { userId: user.id, inputTokens: Number(inputTokens), outputTokens: Number(outputTokens), totalTokens: Number(total), model: "gpt-like", feature: "HUMANIZER" },
      });

      return { remaining: Number(current - total) };
    });

    // Replace with actual AI call; here returns a simple transformation
    const output = input.replace(/\s+/g, " ").trim(); // simple pass-through as example

    return NextResponse.json({ output, usage: { inputTokens: Number(inputTokens), outputTokens: Number(outputTokens), total: Number(total), remaining: result.remaining } }, { status: 200 });
  } catch (err) {
    if (err.message && err.message.includes("Insufficient tokens")) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 402 });
    }
    console.error("humanizer error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
