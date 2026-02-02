import { defineHandler, HTTPError, getRouterParam } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";
import { deleteFromR2 } from "@/lib/r2.server";
import { deleteImageEmbedding } from "@/lib/pinecone.server";

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

  // Find the image and ensure user owns it
  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      userId,
    },
  });

  if (!image) {
    throw new HTTPError("Image not found", { status: 404 });
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
