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
  const existingAlbum = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
  });

  if (!existingAlbum) {
    throw createError({
      statusCode: 404,
      message: "Album not found",
    });
  }

  // Delete album (this will cascade to AlbumImage entries)
  await prisma.album.delete({
    where: { id: albumId },
  });

  return {
    success: true,
    message: "Album deleted successfully",
  };
});
