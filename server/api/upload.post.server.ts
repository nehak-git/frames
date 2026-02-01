import { defineEventHandler, readMultipartFormData, createError } from "h3";
import {
  uploadToR2,
  generateImageKey,
  generateThumbnailKey,
} from "../lib/r2.server";
import { processImage } from "../lib/image-processing.server";
import { addImageProcessingJob } from "../lib/queue.server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default defineEventHandler(async (event) => {
  // TODO: Add proper auth check
  const userId = "demo-user";

  const formData = await readMultipartFormData(event);

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: "No file provided",
    });
  }

  const file = formData.find((f) => f.name === "file");

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      message: "No file provided",
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!file.type || !allowedTypes.includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: "Invalid file type. Only images are allowed.",
    });
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      message: "File size must be less than 10MB",
    });
  }

  const buffer = Buffer.from(file.data);
  const processed = await processImage(buffer);

  const filename = file.filename || "image.jpg";
  const imageKey = generateImageKey(userId, filename);
  const thumbnailKey = generateThumbnailKey(imageKey);

  const [originalUpload, thumbnailUpload] = await Promise.all([
    uploadToR2(imageKey, processed.original, file.type),
    uploadToR2(thumbnailKey, processed.thumbnail, "image/webp"),
  ]);

  const imageId = crypto.randomUUID();

  await addImageProcessingJob({
    imageId,
    userId,
    imageUrl: originalUpload.url,
    thumbnailUrl: thumbnailUpload.url,
    filename,
  });

  return {
    id: imageId,
    url: originalUpload.url,
    thumbnailUrl: thumbnailUpload.url,
    width: processed.width,
    height: processed.height,
    status: "processing",
  };
});
