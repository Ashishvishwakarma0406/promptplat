import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { TokenService } from "@/domain/services/TokenService";

export async function POST(req) {
  const user = await getUserFromCookie();
  if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { amount } = await req.json();
  await TokenService.deductTokens(user._id, amount);
  return NextResponse.json({ success: true });
}
