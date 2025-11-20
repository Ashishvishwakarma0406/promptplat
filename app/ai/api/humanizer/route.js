import { NextResponse } from "next/server";
import { HumanizeText } from "@/application/usecases/HumanizeText";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text } = await req.json();
    if (!text || text.trim().length === 0)
      return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const result = await HumanizeText({ text, userId: user._id });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("AI Humanizer Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process text" }, { status: 500 });
  }
}
