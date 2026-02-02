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

  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId, // Ensure user owns this album
    },
    include: {
      images: {
        orderBy: { order: "asc" },
        include: {
          image: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              filename: true,
              description: true,
              tags: true,
              width: true,
              height: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!album) {
    throw createError({
      statusCode: 404,
      message: "Album not found",
    });
  }

  return {
    id: album.id,
    name: album.name,
    description: album.description,
    isPublic: album.isPublic,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    images: album.images.map((ai) => ({
      ...ai.image,
      order: ai.order,
    })),
  };
});
