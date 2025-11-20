// app/api/prompts/[id]/route.js
import dbConnect from "@/lib/dbconnect";
import Prompt from "@/models/prompt";
import cloudinary from "@/lib/cloudinary";

/** Detects if a URL points to a video resource */
const isVideoUrl = (url) =>
  /\.(mp4|webm|mov|m4v|ogv)$/i.test(url) || url.includes("/video/upload/");

/** Extract Cloudinary public_id from a delivery URL
 * Works with URLs like:
 *   https://res.cloudinary.com/<cloud>/<type>/upload/<transforms...>/v123456/folder/file.ext
 * Returns: "folder/file"
 */
function getPublicIdFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname; // /<cloud>/<type>/upload/<transform?>/v123/<folder>/file.ext
    const upIdx = path.indexOf("/upload/");
    if (upIdx === -1) return null;

    let after = path.slice(upIdx + "/upload/".length); // <transform?>/v123/<folder>/file.ext
    const segs = after.split("/").filter(Boolean);

    // Skip version segment if present (v123456...)
    const vIdx = segs.findIndex((s) => /^v\d+$/.test(s));
    const startIdx = vIdx !== -1 ? vIdx + 1 : 0;

    const rest = segs.slice(startIdx); // e.g. ["folder","file.ext"] or ["file.ext"]
    if (rest.length === 0) return null;

    // Strip extension from last segment
    const last = rest[rest.length - 1];
    const dot = last.lastIndexOf(".");
    rest[rest.length - 1] = dot !== -1 ? last.slice(0, dot) : last;

    return rest.join("/"); // "folder/file" or "file"
  } catch {
    return null;
  }
}

// ---------- GET one ----------
export async function GET(_req, { params }) {
  try {
    await dbConnect();

    const doc = await Prompt.findById(params.id).populate("owner");
    if (!doc) {
      return new Response(JSON.stringify({ error: "Prompt Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(doc), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`GET /api/prompts/${params?.id} error:`, err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ---------- PATCH (partial update) ----------
export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    // Authentication check
    const { getUserFromRequest } = await import("@/lib/auth");
    const userPayload = await getUserFromRequest(req);
    if (!userPayload || (!userPayload.id && !userPayload.sub && !userPayload.userId)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load existing document first (we need current media to delete)
    const doc = await Prompt.findById(params.id);
    if (!doc) {
      return new Response(JSON.stringify({ error: "Prompt Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authorization check: only owner can update
    const userId = userPayload.id || userPayload.sub || userPayload.userId;
    if (String(doc.owner) !== String(userId)) {
      return new Response(JSON.stringify({ error: "Forbidden: You can only update your own prompts" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If media is present in payload, we treat it as a REPLACEMENT.
    // First, best-effort delete all existing media from Cloudinary.
    if (Array.isArray(payload.media)) {
      const existing = Array.isArray(doc.media) ? doc.media : [];
      if (existing.length) {
        await Promise.allSettled(
          existing.map(async (url) => {
            const publicId = getPublicIdFromUrl(url);
            if (!publicId) return;
            const resource_type = isVideoUrl(url) ? "video" : "image";
            try {
              await cloudinary.uploader.destroy(publicId, { resource_type });
            } catch (e) {
              console.error("Cloudinary destroy failed on PATCH:", {
                url,
                publicId,
                resource_type,
                error: e?.message,
              });
            }
          })
        );
      }
      // Replace with the new media URLs
      doc.media = payload.media;
    }

    // Apply other fields
    if (payload.title !== undefined) doc.title = payload.title;
    if (payload.category !== undefined) doc.category = payload.category;
    if (payload.visibility !== undefined) doc.visibility = payload.visibility;
    if (payload.prompt !== undefined) doc.promptContent = payload.prompt;

    await doc.save();

    // Return populated (useful for UI)
    const updated = await Prompt.findById(doc._id).populate("owner");
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`PATCH /api/prompts/${params?.id} error:`, err);
    return new Response(
      JSON.stringify({ error: "Error Updating Prompt", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ---------- DELETE (hard delete removes Cloudinary media too) ----------
export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    // Authentication check
    const { getUserFromRequest } = await import("@/lib/auth");
    const userPayload = await getUserFromRequest(req);
    if (!userPayload || (!userPayload.id && !userPayload.sub && !userPayload.userId)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard");

    if (hard === "1" || hard === "true") {
      // Hard delete: destroy media on Cloudinary, then remove document
      const doc = await Prompt.findById(params.id);
      if (!doc) {
        return new Response(JSON.stringify({ error: "Prompt Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Authorization check: only owner can delete
      const userId = userPayload.id || userPayload.sub || userPayload.userId;
      if (String(doc.owner) !== String(userId)) {
        return new Response(JSON.stringify({ error: "Forbidden: You can only delete your own prompts" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const media = Array.isArray(doc.media) ? doc.media : [];
      if (media.length) {
        await Promise.allSettled(
          media.map(async (url) => {
            const publicId = getPublicIdFromUrl(url);
            if (!publicId) return;
            const resource_type = isVideoUrl(url) ? "video" : "image";
            try {
              await cloudinary.uploader.destroy(publicId, { resource_type });
            } catch (e) {
              console.error("Cloudinary destroy failed on DELETE:", {
                url,
                publicId,
                resource_type,
                error: e?.message,
              });
            }
          })
        );
      }

      await Prompt.findByIdAndDelete(params.id);
      return new Response(
        JSON.stringify({ message: "Prompt and media permanently deleted", hardDeleted: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Soft delete (if your schema has these fields)
    const doc = await Prompt.findById(params.id);
    if (!doc) {
      return new Response(JSON.stringify({ error: "Prompt Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authorization check: only owner can delete
    const userId = userPayload.id || userPayload.sub || userPayload.userId;
    if (String(doc.owner) !== String(userId)) {
      return new Response(JSON.stringify({ error: "Forbidden: You can only delete your own prompts" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await Prompt.findByIdAndUpdate(
      params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    return new Response(JSON.stringify({ message: "Prompt moved to trash", hardDeleted: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`DELETE /api/prompts/${params?.id} error:`, err);
    return new Response(
      JSON.stringify({ error: "Error deleting prompt", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}