import { defineHandler, createError } from "nitro/h3";
import {
  uploadToR2,
  generateImageKey,
  generateThumbnailKey,
} from "@/lib/r2.server";
import { processImage } from "@/lib/image-processing.server";
import { prisma } from "@/lib/prisma.server";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default defineHandler(async (event) => {
  // Get authenticated user from session
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: event.req.headers.get("cookie") || "",
    }),
  });

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const userId = session.user.id;

  const formData = await event.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw createError({
      statusCode: 400,
      message: "No file provided",
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: "Invalid file type. Only images are allowed.",
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      message: "File size must be less than 10MB",
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const processed = await processImage(buffer);

  const filename = file.name || "image.jpg";
  const imageKey = generateImageKey(userId, filename);
  const thumbnailKey = generateThumbnailKey(imageKey);

  const [originalUpload, thumbnailUpload] = await Promise.all([
    uploadToR2(imageKey, processed.original, file.type),
    uploadToR2(thumbnailKey, processed.thumbnail, "image/webp"),
  ]);

  // Create image record in database
  const image = await prisma.image.create({
    data: {
      userId,
      url: originalUpload.url,
      thumbnailUrl: thumbnailUpload.url,
      filename,
      width: processed.width,
      height: processed.height,
      size: file.size,
      mimeType: file.type,
      status: "PROCESSING",
    },
  });

  // Run image processing task (runs in background, doesn't block response)
  runTask("image:process", {
    payload: {
      imageId: image.id,
      userId,
      imageUrl: originalUpload.url,
      thumbnailUrl: thumbnailUpload.url,
      filename,
    },
  });

  return {
    id: image.id,
    url: originalUpload.url,
    thumbnailUrl: thumbnailUpload.url,
    width: processed.width,
    height: processed.height,
    status: "processing",
  };
});
