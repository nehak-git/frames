import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { analyzeImage, generateImageEmbedding } from "./mistral.server";
import { upsertImageEmbedding } from "./pinecone.server";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export interface ImageProcessingJob {
  imageId: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl: string;
  filename: string;
}

export const imageProcessingQueue = new Queue<ImageProcessingJob>(
  "image-processing",
  { connection }
);

export async function addImageProcessingJob(data: ImageProcessingJob) {
  return imageProcessingQueue.add("process-image", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}

export function createImageProcessingWorker() {
  const worker = new Worker<ImageProcessingJob>(
    "image-processing",
    async (job: Job<ImageProcessingJob>) => {
      const { imageId, userId, imageUrl, thumbnailUrl, filename } = job.data;

      console.log(`Processing image: ${imageId}`);

      const analysis = await analyzeImage(imageUrl);

      const embedding = await generateImageEmbedding(
        analysis.description,
        analysis.tags
      );

      await upsertImageEmbedding(imageId, embedding, {
        imageId,
        userId,
        url: imageUrl,
        thumbnailUrl,
        description: analysis.description,
        tags: analysis.tags,
        filename,
      });

      console.log(`Completed processing image: ${imageId}`);

      return {
        description: analysis.description,
        tags: analysis.tags,
      };
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}
