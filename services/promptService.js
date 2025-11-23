// services/promptService.js
import prisma from "@/lib/prisma";

export async function createPrompt({ ownerId, title, category, visibility = "private", promptContent, media = [] }) {
  const prompt = await prisma.prompt.create({
    data: {
      ownerId,
      title,
      category,
      visibility,
      promptContent,
      media,
    },
  });
  return prompt;
}

export async function getPromptById(id) {
  return prisma.prompt.findUnique({
    where: { id },
    include: { owner: { select: { id: true, username: true, email: true, name: true } } },
  });
}

export async function listPublicPrompts({ take = 20, skip = 0, category, orderBy = { likes: "desc" } } = {}) {
  const where = {
    visibility: "public",
    isDeleted: false,
    ...(category ? { category } : {}),
  };
  return prisma.prompt.findMany({
    where,
    orderBy: [orderBy],
    skip,
    take,
    include: { owner: { select: { id: true, username: true, name: true } } },
  });
}

export async function listUserPrompts(userId, { take = 20, skip = 0 } = {}) {
  return prisma.prompt.findMany({
    where: { ownerId: userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export async function incrementLikes(promptId, delta = 1) {
  return prisma.prompt.update({
    where: { id: promptId },
    data: { likes: { increment: delta } },
  });
}

export async function softDeletePrompt(promptId) {
  return prisma.prompt.update({
    where: { id: promptId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
}
