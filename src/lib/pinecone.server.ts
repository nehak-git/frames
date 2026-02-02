import { Pinecone } from "@pinecone-database/pinecone";

const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined;
};

export const pinecone =
  globalForPinecone.pinecone ??
  new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

if (process.env.NODE_ENV !== "production")
  globalForPinecone.pinecone = pinecone;

const IMAGES_INDEX = process.env.PINECONE_IMAGES_INDEX || "images";

export async function getImagesIndex() {
  return pinecone.index({ name: IMAGES_INDEX });
}

export interface ImageMetadata {
  imageId: string;
  userId: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  tags: string[];
  filename: string;
}

export async function upsertImageEmbedding(
  imageId: string,
  embedding: number[],
  metadata: ImageMetadata
) {
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error(`Cannot upsert image ${imageId}: embedding is empty or invalid`);
  }

  const index = await getImagesIndex();

  await index.upsert({
    records: [
      {
        id: imageId,
        values: embedding,
        metadata: {
          ...metadata,
          tags: metadata.tags.join(","),
        },
      },
    ],
  });
}

export async function searchImages(
  embedding: number[],
  userId: string,
  topK = 10
) {
  const index = await getImagesIndex();

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: { userId: { $eq: userId } },
  });

  return results.matches?.map((match) => ({
    id: match.id,
    score: match.score,
    metadata: {
      ...match.metadata,
      tags:
        typeof match.metadata?.tags === "string"
          ? match.metadata.tags.split(",")
          : [],
    } as ImageMetadata,
  }));
}

export async function deleteImageEmbedding(imageId: string) {
  const index = await getImagesIndex();
  await index.deleteOne({ id: imageId });
}
