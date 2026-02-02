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

  const body = await event.request.json();
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: "Album name cannot be empty",
      });
    }
    updateData.name = body.name.trim();
  }

  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null;
  }

  if (body.isPublic !== undefined) {
    updateData.isPublic = Boolean(body.isPublic);
  }

  const album = await prisma.album.update({
    where: { id: albumId },
    data: updateData,
  });

  return {
    id: album.id,
    name: album.name,
    description: album.description,
    isPublic: album.isPublic,
    updatedAt: album.updatedAt,
  };
});
