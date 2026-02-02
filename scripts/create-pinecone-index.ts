import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = process.env.PINECONE_IMAGES_INDEX || "images";
// Mistral embed model produces 1024-dimensional vectors
const DIMENSION = 1024;

async function createIndex() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  console.log(`Checking if index "${INDEX_NAME}" exists...`);

  try {
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(
      (index) => index.name === INDEX_NAME
    );

    if (indexExists) {
      console.log(`Index "${INDEX_NAME}" already exists.`);
      const indexInfo = await pinecone.describeIndex(INDEX_NAME);
      console.log("Index info:", JSON.stringify(indexInfo, null, 2));
      return;
    }

    console.log(`Creating index "${INDEX_NAME}" with dimension ${DIMENSION}...`);

    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    console.log(`Index "${INDEX_NAME}" created successfully!`);
    console.log("Waiting for index to be ready...");

    // Wait for index to be ready
    let isReady = false;
    while (!isReady) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const indexInfo = await pinecone.describeIndex(INDEX_NAME);
      isReady = indexInfo.status?.ready === true;
      console.log(`Index status: ${indexInfo.status?.state}`);
    }

    console.log("Index is ready!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createIndex();
