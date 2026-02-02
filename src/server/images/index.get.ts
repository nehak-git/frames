import { defineHandler, HTTPError, getQuery } from "nitro/h3";
import { prisma } from "@/lib/prisma.server";
import { requireAuth } from "@/lib/auth-utils.server";

export default defineHandler(async (event) => {
  const session = await requireAuth(event);

  if (!session) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const query = getQuery(event);
  
  // Pagination
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  const skip = (page - 1) * limit;
  
  // Filter by status
  const status = query.status as string | undefined;
  const statusFilter = status && ["PROCESSING", "READY", "FAILED"].includes(status)
    ? { status: status as "PROCESSING" | "READY" | "FAILED" }
    : {};

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where: {
        userId,
        ...statusFilter,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        filename: true,
        description: true,
        tags: true,
        width: true,
        height: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.image.count({
      where: {
        userId,
        ...statusFilter,
      },
    }),
  ]);

  return {
    images,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + images.length < total,
    },
  };
});
