import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbconnect";
import Prompt from "@/models/prompt";
import cloudinary from "@/lib/cloudinary";
import { getUserIdFromRequest } from '@/lib/authHelper';

export const runtime = "nodejs"; // required for Cloudinary streams (not Edge)

export async function GET() {
  try {
    await dbConnect();
    const prompts = await Prompt.find({}).sort({ createdAt: -1 });
    return NextResponse.json(prompts, { status: 200 });
  } catch (err) {
    console.error("GET /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to fetch all prompts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    // 1. --- Authentication ---
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 2. --- Parse FormData ---
    const formData = await request.formData();

    // 3. --- Extract and validate form fields ---
    const { sanitizeString, isValidFileType, isValidFileSize } = await import("@/lib/validation");
    
    const title = sanitizeString(formData.get("title") || "", 200);
    const category = sanitizeString(formData.get("category") || "", 50);
    const visibility = formData.get("visibility") || "private";
    const promptText = sanitizeString(formData.get("prompt") || "", 10000); // Form sends "prompt", model expects "promptContent"

    // 4. --- Validate required fields ---
    if (!title || !category || !promptText) {
      return NextResponse.json(
        { error: "title, category, and prompt are required" },
        { status: 400 }
      );
    }

    // Validate visibility
    if (visibility !== "public" && visibility !== "private") {
      return NextResponse.json(
        { error: "visibility must be 'public' or 'private'" },
        { status: 400 }
      );
    }

    // 5. --- Upload files to Cloudinary ---
    const mediaFiles = formData.getAll("files").filter((file) => file instanceof File && file.size > 0);
    const mediaUrls = [];

    // Validate and limit file count
    if (mediaFiles.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 files allowed per prompt" },
        { status: 400 }
      );
    }

    for (const file of mediaFiles) {
      // Validate file type and size
      if (!isValidFileType(file, ["image", "video"])) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only images and videos are allowed.` },
          { status: 400 }
        );
      }

      const maxSizeMB = file.type?.startsWith("video/") ? 50 : 10; // Videos can be larger
      if (!isValidFileSize(file, maxSizeMB)) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is ${maxSizeMB}MB.` },
          { status: 400 }
        );
      }

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
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(buffer);
        });

        mediaUrls.push(uploaded.secure_url);
      } catch (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        // Continue with other files even if one fails
      }
    }

    // 6. --- Create prompt in database ---
    const created = await Prompt.create({
      owner: userId,
      title: title.trim(),
      category: category.trim(),
      visibility,
      promptContent: String(promptText).trim(),
      media: mediaUrls, // array of string URLs (can be empty)
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/prompts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create prompt" },
      { status: 500 }
    );
  }
}