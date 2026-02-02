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

  const body = await event.request.json();
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw new HTTPError("Album name cannot be empty", { status: 400 });
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
