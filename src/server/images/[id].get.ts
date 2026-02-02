import { defineHandler, HTTPError, getRouterParam } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";

export default defineHandler(async (event) => {
  const session = await requireAuth(event);

  if (!session) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const imageId = getRouterParam(event, "id");

  if (!imageId) {
    throw new HTTPError("Image ID is required", { status: 400 });
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
    throw new HTTPError("Image not found", { status: 404 });
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
