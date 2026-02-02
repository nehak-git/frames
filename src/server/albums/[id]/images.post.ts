import { defineHandler, createError, getRouterParam } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";

export default defineHandler(async (event) => {
  const session = await requireAuth(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const userId = session.user.id;
  const albumId = getRouterParam(event, "id");

  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: "Album ID is required",
    });
  }

  // Check album exists and user owns it
  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
  });

  if (!album) {
    throw createError({
      statusCode: 404,
      message: "Album not found",
    });
  }

  const body = await event.request.json();
  const { imageIds } = body;

  if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "imageIds array is required",
    });
  }

  // Verify all images belong to the user
  const userImages = await prisma.image.findMany({
    where: {
      id: { in: imageIds },
      userId,
    },
    select: { id: true },
  });

  const validImageIds = userImages.map((img) => img.id);
  const invalidIds = imageIds.filter((id: string) => !validImageIds.includes(id));

  if (invalidIds.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid image IDs: ${invalidIds.join(", ")}`,
    });
  }

  // Get current max order
  const maxOrder = await prisma.albumImage.findFirst({
    where: { albumId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  let nextOrder = (maxOrder?.order ?? -1) + 1;

  // Add images to album (skip duplicates)
  const existingLinks = await prisma.albumImage.findMany({
    where: {
      albumId,
      imageId: { in: validImageIds },
    },
    select: { imageId: true },
  });

  const existingImageIds = new Set(existingLinks.map((l) => l.imageId));
  const newImageIds = validImageIds.filter((id) => !existingImageIds.has(id));

  if (newImageIds.length > 0) {
    await prisma.albumImage.createMany({
      data: newImageIds.map((imageId) => ({
        albumId,
        imageId,
        order: nextOrder++,
      })),
    });
  }

  return {
    success: true,
    added: newImageIds.length,
    skipped: validImageIds.length - newImageIds.length,
  };
});
