// app/api/prompts/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getUserIdFromRequest } from "@/lib/apiHelpers";
import { sanitizeString, isValidFileType, isValidFileSize } from "@/lib/validation";

export const runtime = "nodejs";

async function uploadFileToCloudinary(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const resource_type = file.type?.startsWith("video/")
    ? "video"
    : file.type?.startsWith("image/")
    ? "image"
    : "auto";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "promteplat/prompts", resource_type },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });
}

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
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();

    const titleRaw = String(formData.get("title") || "");
    const categoryRaw = String(formData.get("category") || "");
    const visibilityRaw = String(formData.get("visibility") || "private");
    const promptRaw = String(formData.get("prompt") || "");

    const title = sanitizeString(titleRaw, 200);
    const category = sanitizeString(categoryRaw, 50);
    const visibility = visibilityRaw === "public" ? "public" : "private";
    const promptText = sanitizeString(promptRaw, 10000);

    if (!title || !category || !promptText) {
      return NextResponse.json({ error: "title, category, and prompt are required" }, { status: 400 });
    }

    // collect files
    const files = formData.getAll("files").filter((f) => f && typeof f.arrayBuffer === "function");
    if (files.length > 10) {
      return NextResponse.json({ error: "Maximum 10 files allowed" }, { status: 400 });
    }

    const mediaUrls = [];

    for (const file of files) {
      // validate type & size using helpers if present, otherwise basic checks
      try {
        if (typeof isValidFileType === "function") {
          if (!isValidFileType(file, ["image", "video"])) {
            console.warn("Skipping invalid file type:", file.name);
            continue;
          }
        } else {
          if (!file.type?.startsWith("image/") && !file.type?.startsWith("video/")) {
            console.warn("Skipping non-image/video file:", file.name);
            continue;
          }
        }

        if (typeof isValidFileSize === "function") {
          const maxMB = file.type?.startsWith("video/") ? 50 : 10;
          if (!isValidFileSize(file, maxMB)) {
            console.warn("Skipping file over size limit:", file.name);
            continue;
          }
        } else {
          // basic size guard (50MB)
          if (file.size > 50 * 1024 * 1024) {
            console.warn("Skipping very large file:", file.name);
            continue;
          }
        }

        const uploaded = await uploadFileToCloudinary(file);
        if (uploaded?.secure_url) mediaUrls.push(uploaded.secure_url);
      } catch (uploadError) {
        console.error("File upload error for", file.name, uploadError);
      }
    }

    const created = await prisma.prompt.create({
      data: {
        ownerId: userId,
        title: title.trim(),
        category: category.trim(),
        visibility,
        promptContent: promptText.trim(),
        media: mediaUrls,
      },
      include: { owner: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
