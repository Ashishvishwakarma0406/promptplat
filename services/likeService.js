// services/likeService.js
import prisma from "@/lib/prisma";

export async function addLike({ userId, promptId }) {
  // transaction: create Like and increment prompt.likes
  return prisma.$transaction(async (tx) => {
    await tx.like.create({
      data: { userId, promptId },
    });
    const updated = await tx.prompt.update({
      where: { id: promptId },
      data: { likes: { increment: 1 } },
    });
    return updated;
  });
}

export async function removeLike({ userId, promptId }) {
  return prisma.$transaction(async (tx) => {
    await tx.like.deleteMany({
      where: { userId, promptId },
    });
    const updated = await tx.prompt.update({
      where: { id: promptId },
      data: { likes: { increment: -1 } },
    });
    return updated;
  });
}

export async function hasUserLiked({ userId, promptId }) {
  const found = await prisma.like.findUnique({
    where: { userId_promptId: { userId, promptId } },
  });
  return !!found;
}
