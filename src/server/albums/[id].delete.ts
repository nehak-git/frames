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
  const existingAlbum = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
  });

  if (!existingAlbum) {
    throw new HTTPError("Album not found", { status: 404 });
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
