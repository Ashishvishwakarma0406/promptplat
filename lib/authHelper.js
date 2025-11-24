// lib/authHelper.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

/**
 * Read token from cookies (either from Request headers or next/headers).
 * Accepts optional req; if provided reads req.headers.cookie (safe inside routes).
 */
export async function getTokenFromCookies(req = null) {
  try {
    if (req && typeof req.headers?.get === "function") {
      const cookieHeader = req.headers.get("cookie") || "";
      const m = cookieHeader.match(/(?:^|; )token=([^;]+)/);
      return m?.[1] ?? null;
    }
    const cookieStore = await cookies();
    return cookieStore.get?.("token")?.value ?? null;
  } catch (e) {
    console.error("getTokenFromCookies error:", e);
    return null;
  }
}

export async function verifyToken(token) {
  if (!token || !JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Returns user id or null. Accepts optional req.
 */
export async function getUserIdFromRequest(req = null) {
  const token = await getTokenFromCookies(req);
  const decoded = await verifyToken(token);
  return decoded?.id ?? null;
}

/**
 * Returns full user record or null. Accepts optional req.
 */
export async function getUserFromRequest(req = null) {
  const token = await getTokenFromCookies(req);
  const decoded = await verifyToken(token);
  if (!decoded?.id) return null;
  return prisma.user.findUnique({ where: { id: decoded.id } });
}
