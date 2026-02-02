import sharp from "sharp";
import { HTTPError } from "nitro/h3";

// Maximum allowed pixels to prevent memory exhaustion (e.g., 100MP limit)
const MAX_INPUT_PIXELS = 100_000_000;

// Allowed image formats based on magic bytes
const ALLOWED_FORMATS = ["jpeg", "png", "gif", "webp"] as const;
type AllowedFormat = (typeof ALLOWED_FORMATS)[number];

export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  format: AllowedFormat;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

/**
 * Validates and processes an image buffer with security checks:
 * - Magic byte validation (not trusting client MIME type)
 * - Pixel limit to prevent memory exhaustion DoS
 * - Proper EXIF rotation handling for correct dimensions
 */
export async function processImage(
  buffer: Buffer,
  options: { thumbnailWidth?: number; thumbnailHeight?: number } = {}
): Promise<ProcessedImage> {
  const { thumbnailWidth = 300, thumbnailHeight = 300 } = options;

  let image: sharp.Sharp;
  let metadata: sharp.Metadata;

  try {
    // Create sharp instance with pixel limit to prevent DoS
    image = sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    });

    // Get metadata to validate format via magic bytes (not client MIME)
    metadata = await image.metadata();
  } catch (error) {
    // Sharp failed to decode - likely not a valid image or exceeds limits
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("Input image exceeds pixel limit")) {
      throw new HTTPError("Image dimensions too large. Maximum 100 megapixels allowed.", { status: 400 });
    }
    
    throw new HTTPError("Invalid or corrupted image file", { status: 400 });
  }

  // Validate format using detected format (magic bytes), not client-provided MIME
  const detectedFormat = metadata.format as string | undefined;
  if (!detectedFormat || !ALLOWED_FORMATS.includes(detectedFormat as AllowedFormat)) {
    throw new HTTPError(
      `Unsupported image format: ${detectedFormat || "unknown"}. Allowed: ${ALLOWED_FORMATS.join(", ")}`,
      { status: 400 }
    );
  }

  // Apply rotation FIRST, then get dimensions (fixes EXIF rotation issue)
  // This ensures width/height are correct for rotated images
  const rotatedImage = image.rotate(); // Auto-rotate based on EXIF
  const rotatedMetadata = await rotatedImage.clone().metadata();

  // Use rotated dimensions, fallback to original if not available
  const width = rotatedMetadata.width || metadata.width || 0;
  const height = rotatedMetadata.height || metadata.height || 0;

  // Generate original (with EXIF rotation applied)
  const original = await rotatedImage.toBuffer();

  // Generate thumbnail from original buffer with fresh sharp instance
  const thumbnail = await sharp(buffer, {
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .rotate() // Auto-rotate based on EXIF
    .resize(thumbnailWidth, thumbnailHeight, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    original,
    thumbnail,
    format: detectedFormat as AllowedFormat,
    width,
    height,
    thumbnailWidth,
    thumbnailHeight,
  };
}
