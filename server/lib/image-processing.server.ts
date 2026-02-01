import sharp from "sharp";

export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  contentType: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export async function processImage(
  buffer: Buffer,
  options: { thumbnailWidth?: number; thumbnailHeight?: number } = {}
): Promise<ProcessedImage> {
  const { thumbnailWidth = 300, thumbnailHeight = 300 } = options;

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const original = await image
    .rotate() // Auto-rotate based on EXIF
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .rotate()
    .resize(thumbnailWidth, thumbnailHeight, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    original,
    thumbnail,
    contentType: `image/${metadata.format}`,
    width: metadata.width || 0,
    height: metadata.height || 0,
    thumbnailWidth,
    thumbnailHeight,
  };
}
