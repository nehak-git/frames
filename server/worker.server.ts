import { createImageProcessingWorker } from "./lib/queue.server";

console.log("Starting image processing worker...");

const worker = createImageProcessingWorker();

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

console.log("Worker is running and waiting for jobs...");
