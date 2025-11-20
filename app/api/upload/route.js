import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/dbconnect";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await dbConnect();
    const form = await req.formData();
    const files = form.getAll("files").filter(Boolean);
    if (!files.length) return Response.json({ error: "No files provided" }, { status: 400 });

    // Validate file count
    if (files.length > 10) {
      return Response.json({ error: "Maximum 10 files allowed" }, { status: 400 });
    }

    const { isValidFileType, isValidFileSize } = await import("@/lib/validation");

    const items = [];
    const errors = [];

    // Process files sequentially to avoid overwhelming the server
    for (const file of files) {
      try {
        // Validate file type
        if (!isValidFileType(file, ["image", "video"])) {
          errors.push(`Invalid file type: ${file.name}`);
          continue;
        }

        // Validate file size
        const maxSizeMB = file.type?.startsWith("video/") ? 50 : 10;
        if (!isValidFileSize(file, maxSizeMB)) {
          errors.push(`File too large: ${file.name}. Maximum ${maxSizeMB}MB.`);
          continue;
        }

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

        items.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id, // <-- we'll use this to delete later
          resourceType: uploaded.resource_type,
        });
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        errors.push(`Failed to upload ${file.name}: ${fileError.message}`);
      }
    }

    // If all files failed, return error
    if (items.length === 0 && errors.length > 0) {
      return Response.json(
        { error: "All files failed to upload", details: errors },
        { status: 400 }
      );
    }

    // Return results with any errors as warnings
    const response = {
      urls: items.map(i => i.url),
      publicIds: items.map(i => i.publicId),
      items,
    };

    if (errors.length > 0) {
      response.warnings = errors;
    }

    return Response.json(response, { status: items.length > 0 ? 201 : 400 });
  } catch (e) {
    console.error("Upload error:", e);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}