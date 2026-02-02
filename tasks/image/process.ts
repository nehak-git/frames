import { defineTask } from "nitro/task";
import { analyzeImage, generateImageEmbedding } from "@/lib/mistral.server";
import { upsertImageEmbedding } from "@/lib/pinecone.server";
import { prisma } from "@/lib/prisma.server";

export interface ImageProcessingPayload {
  imageId: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl: string;
  filename: string;
}

export default defineTask({
  meta: {
    name: "image:process",
    description: "Process an uploaded image with AI analysis and embeddings",
  },
  async run({ payload }) {
    const { imageId, userId, imageUrl, thumbnailUrl, filename } =
      payload as ImageProcessingPayload;

    console.log(`[image:process] Processing image: ${imageId}`);
    console.log(`  URL: ${imageUrl}`);

    try {
      // Step 1: Analyze the image with AI
      console.log("  Step 1: Analyzing image with Mistral...");
      const analysis = await analyzeImage(imageUrl);
      console.log(`  Analysis: ${analysis.description.substring(0, 50)}...`);
      console.log(`  Tags: ${analysis.tags.join(", ")}`);

      // Step 2: Generate embedding
      console.log("  Step 2: Generating embedding...");
      const embedding = await generateImageEmbedding(
        analysis.description,
        analysis.tags
      );
      console.log(`  Embedding size: ${embedding.length}`);

      // Step 3: Store embedding in Pinecone
      console.log("  Step 3: Storing in Pinecone...");
      await upsertImageEmbedding(imageId, embedding, {
        imageId,
        userId,
        url: imageUrl,
        thumbnailUrl,
        description: analysis.description,
        tags: analysis.tags,
        filename,
      });

      // Step 4: Update image record in database with analysis results
      console.log("  Step 4: Updating database...");
      await prisma.image.update({
        where: { id: imageId },
        data: {
          description: analysis.description,
          tags: analysis.tags,
          status: "READY",
        },
      });

      console.log(`✓ Completed processing image: ${imageId}`);

      return {
        result: {
          success: true,
          imageId,
          description: analysis.description,
          tags: analysis.tags,
        },
      };
    } catch (error) {
      console.error(`✗ Error processing image ${imageId}:`, error);

      // Mark image as failed in database
      try {
        await prisma.image.update({
          where: { id: imageId },
          data: { status: "FAILED" },
        });
      } catch (dbError) {
        console.error("  Failed to update status in DB:", dbError);
      }

      return {
        result: {
          success: false,
          imageId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },
});
