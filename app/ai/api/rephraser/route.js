import { NextResponse } from "next/server";
import { RephrasePrompt } from "@/application/usecases/RephrasePrompt";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req) {
  const user = await getUserFromCookie();
  if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Prompt text required" }, { status: 400 });

  const result = await RephrasePrompt({ text, userId: user._id });
  return NextResponse.json(result);
}
