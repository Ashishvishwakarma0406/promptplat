// app/api/prompts/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      where: { isDeleted: false },
      include: { owner: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(prompts, { status: 200 });
  } catch (err) {
    console.error("GET /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to fetch all prompts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();

    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const visibility = String(formData.get("visibility") || "private");
    const promptText = String(formData.get("prompt") || "").trim();

    if (!title || !category || !promptText) return NextResponse.json({ error: "title, category, prompt required" }, { status: 400 });

    const files = formData.getAll("files").filter((f) => f && typeof f.arrayBuffer === "function");
    const mediaUrls = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const resource_type = file.type?.startsWith("video/") ? "video" : (file.type?.startsWith("image/") ? "image" : "auto");
        const uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: "promteplat/prompts", resource_type }, (err, res) => (err ? reject(err) : resolve(res)));
          stream.end(buffer);
        });
        mediaUrls.push(uploaded.secure_url);
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
  } catch (error) {
    console.error("POST /api/prompts error:", error);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
