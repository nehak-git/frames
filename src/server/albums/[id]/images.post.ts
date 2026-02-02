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

  // Verify all images belong to the user
  const userImages = await prisma.image.findMany({
    where: {
      id: { in: imageIds },
      userId,
    },
    select: { id: true },
  });

  // Create a Set of valid IDs for O(1) lookup
  const validIdSet = new Set(userImages.map((img) => img.id));
  
  // Preserve the original request order by filtering imageIds (not mapping userImages)
  const validImageIds = imageIds.filter((id: string) => validIdSet.has(id));
  const invalidIds = imageIds.filter((id: string) => !validIdSet.has(id));

  if (invalidIds.length > 0) {
    throw new HTTPError(`Invalid image IDs: ${invalidIds.join(", ")}`, { status: 400 });
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
