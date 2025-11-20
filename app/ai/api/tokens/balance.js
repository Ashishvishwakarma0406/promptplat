import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { TokenService } from "@/domain/services/TokenService";

export async function GET(req) {
  const user = await getUserFromCookie();
  if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tokens = await TokenService.getBalance(user._id);
  return NextResponse.json({ tokens });
}
