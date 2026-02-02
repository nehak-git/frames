import { defineHandler, HTTPError, getRouterParam } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";

export default defineHandler(async (event) => {
  const session = await requireAuth(event);

  if (!session) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const albumId = getRouterParam(event, "id");

  if (!albumId) {
    throw new HTTPError("Album ID is required", { status: 400 });
  }

  // Check album exists and user owns it
  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
  });

  if (!album) {
    throw new HTTPError("Album not found", { status: 404 });
  }

  const body = await event.request.json();
  const { imageIds } = body;

  if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
    throw new HTTPError("imageIds array is required", { status: 400 });
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
