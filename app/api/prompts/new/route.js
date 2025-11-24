// app/api/prompts/new/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "").trim();
    const visibility = String(form.get("visibility") || "private");
    const promptText = String(form.get("prompt") || "").trim();

    if (!title || !category || !promptText) {
      return NextResponse.json({ error: "title, category, and prompt required" }, { status: 400 });
    }

    const files = form.getAll("files").filter((f) => f && typeof f.arrayBuffer === "function");
    const mediaUrls = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const resource_type = file.type?.startsWith("video/")
          ? "video"
          : file.type?.startsWith("image/")
          ? "image"
          : "auto";

        const uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "promteplat/prompts", resource_type },
            (err, res) => (err ? reject(err) : resolve(res))
          );
          stream.end(buffer);
        });

        if (uploaded?.secure_url) mediaUrls.push(uploaded.secure_url);
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
      }
    }

    const created = await prisma.prompt.create({
      data: {
        ownerId: userId,
        title,
        category,
        visibility,
        promptContent: promptText,
        media: mediaUrls,
      },
      include: { owner: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/prompts/new error:", err);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
