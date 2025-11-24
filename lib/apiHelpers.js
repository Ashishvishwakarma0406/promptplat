// lib/apiHelpers.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

/**
 * Get raw JWT token from either:
 *  - an incoming Request (req.headers.cookie), OR
 *  - Next.js cookies() (awaited)
 *
 * @param {Request|null} req
 * @returns {Promise<string|null>}
 */
export async function getJwtFromCookies(req = null) {
  try {
    if (req && typeof req.headers?.get === "function") {
      const cookieHeader = req.headers.get("cookie") || "";
      const m = cookieHeader.match(/(?:^|; )token=([^;]+)/);
      return m?.[1] ?? null;
    }

    // Fallback to next/headers cookies() for server components/routes that can await it
    const cookieStore = await cookies();
    return cookieStore.get?.("token")?.value ?? null;
  } catch (e) {
    console.error("getJwtFromCookies error:", e);
    return null;
  }
}

/**
 * Deprecated convenience sync accessor.
 * Note: Using this in routes can trigger Next.js "cookies() should be awaited" in dev.
 * Prefer the async getJwtFromCookies(req).
 */
export function getJwtFromCookiesSync() {
  try {
    // best-effort: may throw in some environments; wrap in try/catch
    const cookieStore = cookies();
    return cookieStore.get?.("token")?.value ?? null;
  } catch (e) {
    console.warn("getJwtFromCookiesSync: cookies() sync access failed. Use async getJwtFromCookies(req) instead.");
    return null;
  }
}

/**
 * Return authenticated user id (or null).
 * Accepts optional Request — if provided it will use header cookie (safe for route handlers).
 *
 * @param {Request|null} req
 * @returns {Promise<string|null>}
 */
export async function getUserIdFromRequest(req = null) {
  try {
    if (!JWT_SECRET) return null;
    const token = await getJwtFromCookies(req);
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns full user object or null.
 * Use in server routes: await getAuthenticatedUser(req)
 *
 * @param {Request|null} req
 * @returns {Promise<import('@prisma/client').User|null>}
 */
export async function getAuthenticatedUser(req = null) {
  const id = await getUserIdFromRequest(req);
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
