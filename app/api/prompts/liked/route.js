import dbConnect from "@/lib/dbconnect";
import Like from "@/models/like";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();

    const me = await getUserFromCookie();
    const userId = me?.id || me?._id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return ONLY public, not-deleted prompts (populate owner basics)
    const liked = await Like.find({ user: userId })
      .populate({
        path: "prompt",
        match: { visibility: "public", isDeleted: { $ne: true } },
        populate: { path: "owner", select: "name username imageUrl" },
      })
      .lean();

    const prompts = liked.map((e) => e.prompt).filter(Boolean);

    return new Response(JSON.stringify({ prompts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/prompts/liked error:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch liked prompts" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}