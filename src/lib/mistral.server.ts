import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});

export interface ImageAnalysis {
  description: string;
  tags: string[];
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const response = await mistral.chat.complete({
    model: "mistral-small-2506",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            imageUrl: imageUrl,
          },
          {
            type: "text",
            text: `Analyze this image and provide:
1. A detailed description (2-3 sentences) of what's in the image
2. A list of relevant tags/keywords (5-15 tags)

Respond in JSON format:
{
  "description": "...",
  "tags": ["tag1", "tag2", ...]
}`,
          },
        ],
      },
    ],
    responseFormat: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to analyze image");
  }

  return JSON.parse(content) as ImageAnalysis;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await mistral.embeddings.create({
    model: "mistral-embed",
    inputs: [text],
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    console.error("Embedding response:", JSON.stringify(response, null, 2));
    throw new Error("Failed to generate embedding - received empty or invalid embedding");
  }

  return embedding;
}

export async function generateImageEmbedding(
  description: string,
  tags: string[]
): Promise<number[]> {
  const text = `${description}\n\nTags: ${tags.join(", ")}`;
  return generateEmbedding(text);
}
