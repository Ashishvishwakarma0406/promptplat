// services/userService.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function createUser({ name, username, email, password }) {
  const hashed = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { name, username, email, password: hashed },
  });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

export async function findUserForAuth({ emailOrUsername }) {
  if (emailOrUsername.includes("@")) {
    return prisma.user.findUnique({ where: { email: emailOrUsername } });
  }
  return prisma.user.findUnique({ where: { username: emailOrUsername } });
}
