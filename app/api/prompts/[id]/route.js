// app/api/prompts/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/apiHelpers";
import cloudinary from "@/lib/cloudinary";

/* helpers */
const isVideoUrl = (url) => /\.(mp4|webm|mov|m4v|ogv)$/i.test(url) || url.includes("/video/upload/");

function getPublicIdFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const upIdx = path.indexOf("/upload/");
    if (upIdx === -1) return null;
    let after = path.slice(upIdx + "/upload/".length);
    const segs = after.split("/").filter(Boolean);
    const vIdx = segs.findIndex((s) => /^v\d+$/.test(s));
    const startIdx = vIdx !== -1 ? vIdx + 1 : 0;
    const rest = segs.slice(startIdx);
    if (rest.length === 0) return null;
    const last = rest[rest.length - 1];
    const dot = last.lastIndexOf(".");
    rest[rest.length - 1] = dot !== -1 ? last.slice(0, dot) : last;
    return rest.join("/");
  } catch {
    return null;
  }
}

export async function GET(_req, { params }) {
  try {
    const doc = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: { owner: { select: { id: true, name: true, username: true } } },
    });
    if (!doc || doc.isDeleted) return NextResponse.json({ error: "Prompt Not Found" }, { status: 404 });
    return NextResponse.json(doc, { status: 200 });
  } catch (err) {
    console.error(`GET prompt ${params?.id} error:`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload;
    try { payload = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const doc = await prisma.prompt.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: "Prompt Not Found" }, { status: 404 });
    if (doc.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (Array.isArray(payload.media)) {
      const existing = Array.isArray(doc.media) ? doc.media : [];
      await Promise.allSettled(existing.map(async (url) => {
        const publicId = getPublicIdFromUrl(url);
        if (!publicId) return;
        const resource_type = isVideoUrl(url) ? "video" : "image";
        try { await cloudinary.uploader.destroy(publicId, { resource_type }); } catch (e) {
          console.error("Cloudinary destroy failed:", { url, publicId, e: e?.message });
        }
      }));
    }

    const data = {};
    if (payload.media !== undefined) data.media = payload.media;
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.category !== undefined) data.category = payload.category;
    if (payload.visibility !== undefined) data.visibility = payload.visibility;
    if (payload.prompt !== undefined) data.promptContent = payload.prompt;

    const updated = await prisma.prompt.update({
      where: { id: params.id },
      data,
      include: { owner: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(`PATCH prompt ${params?.id} error:`, err);
    return NextResponse.json({ error: "Error Updating Prompt" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const hard = url.searchParams.get("hard");

    const doc = await prisma.prompt.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: "Prompt Not Found" }, { status: 404 });
    if (doc.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (hard === "1" || hard === "true") {
      const media = Array.isArray(doc.media) ? doc.media : [];
      await Promise.allSettled(media.map(async (url) => {
        const publicId = getPublicIdFromUrl(url);
        if (!publicId) return;
        const resource_type = isVideoUrl(url) ? "video" : "image";
        try { await cloudinary.uploader.destroy(publicId, { resource_type }); } catch (e) {
          console.error("Cloudinary destroy failed:", { url, publicId, e: e?.message });
        }
      }));

      await prisma.prompt.delete({ where: { id: params.id } });
      return NextResponse.json({ message: "Prompt and media permanently deleted", hardDeleted: true }, { status: 200 });
    }

    await prisma.prompt.update({ where: { id: params.id }, data: { isDeleted: true, deletedAt: new Date() } });
    return NextResponse.json({ message: "Prompt moved to trash", hardDeleted: false }, { status: 200 });
  } catch (err) {
    console.error(`DELETE prompt ${params?.id} error:`, err);
    return NextResponse.json({ error: "Error deleting prompt" }, { status: 500 });
  }
}
