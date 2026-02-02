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

  // Remove images from album
  const result = await prisma.albumImage.deleteMany({
    where: {
      albumId,
      imageId: { in: imageIds },
    },
  });

  return {
    success: true,
    removed: result.count,
  };
});
