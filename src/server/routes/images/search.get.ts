import { defineHandler, getQuery, createError } from "nitro/h3";
import { generateEmbedding } from "../lib/mistral.server";
import { searchImages } from "../lib/pinecone.server";

export default defineHandler(async (event) => {
  // TODO: Add proper auth check
  const userId = "demo-user";

  const query = getQuery(event);
  const q = query.q as string | undefined;

  if (!q) {
    throw createError({
      statusCode: 400,
      message: "Missing search query",
    });
  }

  const embedding = await generateEmbedding(q);
  const results = await searchImages(embedding, userId);

  return {
    results:
      results?.map((r) => ({
        id: r.id,
        score: r.score,
        url: r.metadata.url,
        thumbnailUrl: r.metadata.thumbnailUrl,
        description: r.metadata.description,
        tags: r.metadata.tags,
        filename: r.metadata.filename,
      })) ?? [],
  };
});
