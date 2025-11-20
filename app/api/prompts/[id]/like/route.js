// app/api/prompts/[id]/like/route.js
import dbConnect from "@/lib/dbconnect";
import Prompt from "@/models/prompt";
import Like from "@/models/like";
import { getUserFromCookie } from "@/lib/auth";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(req, { params }) {
  try {
    await dbConnect();

    const me = await getUserFromCookie();
    const userId = me?.id || me?._id;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const pid = new mongoose.Types.ObjectId(params.id);
    const uid = new mongoose.Types.ObjectId(String(userId));

    const prompt = await Prompt.findById(pid).select("visibility likes");
    if (!prompt || prompt.visibility !== "public") {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Try to CREATE a like first (unique index enforces 1/user)
    try {
      await Like.create({ user: uid, prompt: pid });     // succeeds only if this user hasn't liked
      const after = await Prompt.findByIdAndUpdate(
        pid,
        { $inc: { likes: 1 } },
        { new: true, select: "likes" }
      );
      return Response.json({ liked: true, likes: after.likes }, { status: 200 });
    } catch (err) {
      // If duplicate key -> the user already liked; we should UNLIKE
      if (err?.code !== 11000) throw err;

      // Delete ONLY this (user, prompt) like. Decrement ONLY if deletedCount === 1
      const del = await Like.deleteOne({ user: uid, prompt: pid });
      if (del.deletedCount === 1) {
        const after = await Prompt.findByIdAndUpdate(
          pid,
          { $inc: { likes: -1 } },
          { new: true, select: "likes" }
        );
        // clamp to 0 just in case
        if (after.likes < 0) {
          await Prompt.findByIdAndUpdate(pid, { $set: { likes: 0 } });
          return Response.json({ liked: false, likes: 0 }, { status: 200 });
        }
        return Response.json({ liked: false, likes: after.likes }, { status: 200 });
      }

      // Nothing was deleted (shouldn't happen with unique index) → return current state
      const current = await Prompt.findById(pid).select("likes");
      return Response.json({ liked: true, likes: current?.likes ?? 0 }, { status: 200 });
    }
  } catch (e) {
    console.error("POST /api/prompts/[id]/like error:", e);
    return Response.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const me = await getUserFromCookie();
    const userId = me?.id || me?._id || null;

    const pid = new mongoose.Types.ObjectId(params.id);
    const prompt = await Prompt.findById(pid).select("visibility likes");
    if (!prompt || prompt.visibility !== "public") {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    let liked = false;
    if (userId) {
      const uid = new mongoose.Types.ObjectId(String(userId));
      liked = !!(await Like.findOne({ user: uid, prompt: pid }).lean());
    }

    return Response.json({ likes: Math.max(prompt.likes || 0, 0), liked }, { status: 200 });
  } catch (e) {
    console.error("GET /api/prompts/[id]/like error:", e);
    return Response.json({ error: "Failed to load like status" }, { status: 500 });
  }
}