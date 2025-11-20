// lib/auth.js
import jwt from "jsonwebtoken";
import UserModel from "@/models/user"; // optional: if you want to fetch full user from DB

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "";

if (!JWT_SECRET) {
  console.error(
    "CRITICAL: JWT secret not set (JWT_SECRET or NEXTAUTH_SECRET). Authentication will fail."
  );
  // In production, we should throw an error to prevent insecure deployment
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production environment");
  }
}

/**
 * getUserFromToken(token)
 * - verifies and decodes the JWT token and returns the decoded payload.
 * - returns null on failure.
 */
export async function getUserFromToken(token) {
  if (!token || typeof token !== "string") return null;
  if (!JWT_SECRET) {
    // Security: Never allow unverified tokens
    console.error("getUserFromToken: JWT_SECRET not set, rejecting token");
    return null;
  }
  try {
    // Accept tokens with "Bearer " prefix
    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
    const payload = jwt.verify(raw, JWT_SECRET);
    return payload || null;
  } catch (err) {
    // token invalid/expired
    // console.debug("getUserFromToken failed:", err?.message || err);
    return null;
  }
}

/**
 * parseCookieHeader - tiny cookie parser for header string
 */
function parseCookieHeader(cookieHeader = "") {
  const map = {};
  cookieHeader.split(";").forEach((pair) => {
    const [k, ...rest] = pair.split("=");
    if (!k) return;
    const key = k.trim();
    const val = rest.join("=").trim();
    if (key) map[key] = decodeURIComponent(val || "");
  });
  return map;
}

/**
 * getUserFromRequest(req)
 * - safe helper that reads token from a cookie named `token` (or Authorization header)
 * - works with Next.js App Router NextRequest (await req.cookies.get('token')) or with plain Node/Express style req.headers.cookie
 *
 * Returns decoded token payload (not full DB user). If you want DB user, call UserModel.findById(payload.sub) afterwards (if you have a user model).
 */
export async function getUserFromRequest(req) {
  if (!req) return null;

  // 1) Next.js App Router NextRequest where cookies() is a function that returns a cookie store
  try {
    // In Next.js route handlers, `req.cookies` may be a function that returns cookies; calling it must be awaited.
    // We'll attempt multiple safe ways:
    // - If req.cookies?.get is a function (NextRequest), use it and await .value
    if (req.cookies && typeof req.cookies.get === "function") {
      // NextRequest case: cookie store where get returns a Cookie object
      const tokenCookie = await req.cookies.get("token");
      const token = tokenCookie?.value ?? null;
      if (token) {
        const payload = await getUserFromToken(token);
        return payload;
      }
    }

    // 2) If req.cookies is a plain object (older frameworks) or req.headers.cookie exists
    if (req.cookies && typeof req.cookies === "object" && !req.cookies.get) {
      // e.g. { token: '...' } or { token: { value: '...' } }
      const tokenVal =
        (typeof req.cookies.token === "string" && req.cookies.token) ||
        (req.cookies.token && req.cookies.token.value) ||
        null;
      if (tokenVal) {
        const payload = await getUserFromToken(tokenVal);
        return payload;
      }
    }

    // 3) Authorization header (Bearer token)
    const authHeader = (req.headers && (req.headers.get?.("authorization") || req.headers["authorization"] || req.headers.authorization)) || "";
    if (authHeader) {
      const payload = await getUserFromToken(authHeader);
      if (payload) return payload;
    }

    // 4) cookie header parsing fallback
    const cookieHeader = (req.headers && (req.headers.get?.("cookie") || req.headers.cookie)) || "";
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      const tokenVal = cookies.token || cookies.__session || cookies.session || null;
      if (tokenVal) {
        const payload = await getUserFromToken(tokenVal);
        return payload;
      }
    }
  } catch (err) {
    console.error("getUserFromRequest error:", err?.message || err);
    return null;
  }

  return null;
}

/**
 * Optional convenience: fetch full user document from DB if you keep user id in token 'sub' or 'userId'
 * - returns DB user or null
 */
export async function getFullUserFromRequest(req) {
  const payload = await getUserFromRequest(req);
  if (!payload) return null;
  const userId = payload.sub || payload.userId || payload.id;
  if (!userId) return payload; // return payload if no id present
  try {
    if (!UserModel) return payload;
    const user = await UserModel.findById(userId).lean();
    return user || payload;
  } catch (e) {
    console.error("getFullUserFromRequest error:", e?.message || e);
    return payload;
  }
}

/**
 * getUserFromCookie() - Convenience wrapper for Next.js cookie-based auth
 * Uses Next.js cookies() API to get token and decode it
 */
export async function getUserFromCookie() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return await getUserFromToken(token);
  } catch (err) {
    console.error("getUserFromCookie error:", err?.message || err);
    return null;
  }
}

export default {
  getUserFromToken,
  getUserFromRequest,
  getFullUserFromRequest,
  getUserFromCookie,
};
