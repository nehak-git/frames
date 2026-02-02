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
  const imageId = getRouterParam(event, "id");

  if (!imageId) {
    throw createError({
      statusCode: 400,
      message: "Image ID is required",
    });
  }

  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      userId, // Ensure user owns this image
    },
    include: {
      albums: {
        include: {
          album: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!image) {
    throw createError({
      statusCode: 404,
      message: "Image not found",
    });
  }

  return {
    id: image.id,
    url: image.url,
    thumbnailUrl: image.thumbnailUrl,
    filename: image.filename,
    description: image.description,
    tags: image.tags,
    width: image.width,
    height: image.height,
    size: image.size,
    mimeType: image.mimeType,
    status: image.status,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    albums: image.albums.map((a) => a.album),
  };
});
