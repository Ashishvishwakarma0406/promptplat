// app/api/prompts/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getUserIdFromRequest } from "@/lib/apiHelpers";

/* utils */
const isVideoUrl = (url) =>
  /\.(mp4|webm|mov|m4v|ogv)$/i.test(url) || url.includes("/video/upload/");

function getPublicIdFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname;

    const uploadIdx = path.indexOf("/upload/");
    if (uploadIdx === -1) return null;

    let after = path.slice(uploadIdx + "/upload/".length);
    const parts = after.split("/").filter(Boolean);

    const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const start = versionIdx !== -1 ? versionIdx + 1 : 0;

    const list = parts.slice(start);
    if (!list.length) return null;

    const last = list[list.length - 1];
    const dot = last.lastIndexOf(".");
    list[list.length - 1] = dot !== -1 ? last.slice(0, dot) : last;

    return list.join("/");
  } catch {
    return null;
  }
}

export async function GET(req, { params }) {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, username: true } }
      }
    });

    if (!prompt || prompt.isDeleted)
      return NextResponse.json({ error: "Prompt Not Found" }, { status: 404 });

    return NextResponse.json(prompt, { status: 200 });
  } catch (err) {
    console.error(`GET prompt ${params.id} error:`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const prompt = await prisma.prompt.findUnique({ where: { id: params.id } });
    if (!prompt) return NextResponse.json({ error: "Prompt Not Found" }, { status: 404 });

    if (prompt.ownerId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    /* -- MEDIA REPLACEMENT -- */
    if (Array.isArray(body.media)) {
      const existing = prompt.media || [];
      await Promise.allSettled(
        existing.map(async (url) => {
          const publicId = getPublicIdFromUrl(url);
          if (!publicId) return;

          const resource_type = isVideoUrl(url) ? "video" : "image";
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type });
          } catch (err) {
            console.error("Cloudinary delete error:", err?.message);
          }
        })
      );
    }

    const updateData = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.visibility !== undefined && { visibility: body.visibility }),
      ...(body.prompt !== undefined && { promptContent: body.prompt }),
      ...(body.media !== undefined && { media: body.media }),
    };

    const updated = await prisma.prompt.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, username: true } }
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(`PATCH prompt ${params.id} error:`, err);
    return NextResponse.json({ error: "Error Updating Prompt" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const hard = url.searchParams.get("hard");

    const prompt = await prisma.prompt.findUnique({ where: { id: params.id } });
    if (!prompt) return NextResponse.json({ error: "Prompt Not Found" }, { status: 404 });

    if (prompt.ownerId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (hard === "1" || hard === "true") {
      const media = prompt.media || [];

      await Promise.allSettled(
        media.map(async (url) => {
          const publicId = getPublicIdFromUrl(url);
          if (!publicId) return;

          const resource_type = isVideoUrl(url) ? "video" : "image";
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type });
          } catch (err) {
            console.error("Cloudinary delete error:", err?.message);
          }
        })
      );

      await prisma.prompt.delete({ where: { id: params.id } });

      return NextResponse.json(
        { message: "Prompt and media permanently deleted", hardDeleted: true },
        { status: 200 }
      );
    }

    await prisma.prompt.update({
      where: { id: params.id },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    return NextResponse.json(
      { message: "Prompt moved to trash", hardDeleted: false },
      { status: 200 }
    );
  } catch (err) {
    console.error(`DELETE prompt ${params.id} error:`, err);
    return NextResponse.json({ error: "Error deleting prompt" }, { status: 500 });
  }
}
