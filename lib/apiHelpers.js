// lib/apiHelpers.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const getJwtFromCookies = () => {
  const cookieStore = cookies();
  const token = cookieStore.get?.("token")?.value ?? null;
  return token;
};

export async function getUserIdFromRequest() {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
  if (!JWT_SECRET) return null;
  const token = getJwtFromCookies();
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

// returns full user (or null)
export async function getAuthenticatedUser() {
  const id = await getUserIdFromRequest();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
