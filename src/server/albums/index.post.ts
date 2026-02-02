import { defineHandler, HTTPError } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";

export default defineHandler(async (event) => {
  const session = await requireAuth(event);

  if (!session) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const body = await event.request.json();

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    throw new HTTPError("Album name is required", { status: 400 });
  }

  const album = await prisma.album.create({
    data: {
      userId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      isPublic: body.isPublic ?? false,
    },
  });

  return {
    id: album.id,
    name: album.name,
    description: album.description,
    isPublic: album.isPublic,
    createdAt: album.createdAt,
  };
});
