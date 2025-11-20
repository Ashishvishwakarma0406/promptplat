import dbConnect from "@/lib/dbconnect";
import Prompt from "@/models/prompt";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs"; // required for Cloudinary streams (not Edge)

export async function POST(req) {
  try {
    await dbConnect();

    const form = await req.formData();

    // Required fields
    const owner = form.get("owner"); // must be a valid user _id
    const title = form.get("title");
    const category = form.get("category");
    const visibility = form.get("visibility") || "private";
    const promptText = form.get("prompt"); // from your form; we save to promptContent

    if (!owner || !title || !category || !promptText) {
      return new Response(
        JSON.stringify({ error: "owner, title, category, and prompt are required" }),
        { status: 400 }
      );
    }

    // Upload files -> media URLs
    const mediaFiles = form.getAll("files").filter(Boolean);
    const mediaUrls = [];

    for (const file of mediaFiles) {
      // file is a web File
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
    }

    const created = await Prompt.create({
      owner,
      title,
      category,
      visibility,
      promptContent: String(promptText),
      media: mediaUrls, // array of string URLs
    });

    return new Response(JSON.stringify(created), { status: 201 });
  } catch (err) {
    console.error("POST /api/myprompt/new error:", err);
    return new Response(JSON.stringify({ error: "Failed to create prompt" }), { status: 500 });
  }
}