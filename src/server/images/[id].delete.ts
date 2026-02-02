import { defineHandler, createError, getRouterParam } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";
import { deleteFromR2 } from "@/lib/r2.server";
import { deleteImageEmbedding } from "@/lib/pinecone.server";

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

  // Find the image and ensure user owns it
  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      userId,
    },
  });

  if (!image) {
    throw createError({
      statusCode: 404,
      message: "Image not found",
    });
  }

  // Extract R2 keys from URLs
  const getKeyFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // Remove leading slash
    } catch {
      return null;
    }
  };

  const originalKey = getKeyFromUrl(image.url);
  const thumbnailKey = getKeyFromUrl(image.thumbnailUrl);

  // Delete from R2, Pinecone, and database in parallel
  await Promise.all([
    // Delete from R2
    originalKey ? deleteFromR2(originalKey).catch(console.error) : Promise.resolve(),
    thumbnailKey ? deleteFromR2(thumbnailKey).catch(console.error) : Promise.resolve(),
    // Delete from Pinecone
    deleteImageEmbedding(imageId).catch(console.error),
    // Delete from database (this will cascade to AlbumImage)
    prisma.image.delete({ where: { id: imageId } }),
  ]);

  return {
    success: true,
    message: "Image deleted successfully",
  };
});
