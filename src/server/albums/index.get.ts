import { defineHandler, HTTPError } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";

export default defineHandler(async (event) => {
  const session = await requireAuth(event);

  if (!session) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const albums = await prisma.album.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { images: true },
      },
      images: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          image: {
            select: {
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  });

  return {
    albums: albums.map((album) => ({
      id: album.id,
      name: album.name,
      description: album.description,
      isPublic: album.isPublic,
      imageCount: album._count.images,
      coverImage: album.images[0]?.image.thumbnailUrl || null,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
    })),
  };
});
