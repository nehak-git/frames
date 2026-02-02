# Frames

Frames is an AI-powered image management application that lets you organize, search, and discover your photos using natural language. Instead of manually tagging photos or searching through endless folders, simply describe what you're looking for—"sunset at the beach," "birthday party with cake," or "my dog playing in the snow"—and Frames finds the matching images instantly.

## What It Does

### Semantic Image Search

At its core, Frames uses AI to understand the content of your images. When you upload a photo, the application:

1. **Analyzes the image** using Mistral's vision AI to generate a rich description of what's in the photo—objects, people, scenes, colors, mood, and context
2. **Creates vector embeddings** from these descriptions, transforming visual content into searchable mathematical representations
3. **Stores embeddings in Pinecone**, a vector database optimized for similarity search

When you search, your query is converted into the same vector space, and Frames finds images whose content is semantically similar to what you described—even if your exact words don't appear in any description.

### Smart Organization with Albums

Beyond search, Frames provides traditional album-based organization:

- Create albums to group related photos
- Add images to multiple albums
- Maintain custom ordering within albums
- Album images preserve the order you specify when adding them

### Secure Multi-User Platform

Frames is built as a multi-user application with complete data isolation:

- User authentication via Better Auth with session management
- Each user only sees and searches their own images
- Secure image upload with validation and processing
- Private cloud storage per user

## Architecture

### Image Processing Pipeline

When you upload an image, Frames runs a sophisticated processing pipeline:

1. **Security validation** — Magic byte verification ensures the file is actually an image (not a renamed malicious file), with pixel limits to prevent memory exhaustion attacks
2. **EXIF handling** — Automatic rotation based on EXIF orientation data, with correct dimension extraction post-rotation
3. **Thumbnail generation** — Creates optimized thumbnails for fast gallery loading
4. **Cloud storage** — Uploads both original and thumbnail to Cloudflare R2
5. **AI analysis** — Background task sends the image to Mistral for content analysis
6. **Vector indexing** — Generated description is embedded and stored in Pinecone for search

### Search Flow

When you search for images:

1. Your natural language query is converted to a vector embedding
2. Pinecone performs approximate nearest neighbor search across your image embeddings
3. Top matching image IDs are returned with similarity scores
4. Full image details are fetched from PostgreSQL
5. Results are returned ranked by semantic relevance

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TanStack Router, Vite |
| Backend | Nitro (server routes + background tasks) |
| Database | PostgreSQL with Prisma ORM |
| Vector Search | Pinecone |
| AI/Vision | Mistral (image analysis + embeddings) |
| Storage | Cloudflare R2 |
| Auth | Better Auth with Prisma adapter |

## Key Features

- **Natural language search** — Find images by describing their content
- **Automatic image understanding** — AI analyzes and indexes every upload
- **Fast thumbnail loading** — Optimized thumbnails for responsive galleries
- **Album organization** — Group and order images manually
- **Secure uploads** — Magic byte validation, pixel limits, format verification
- **Background processing** — AI analysis runs asynchronously without blocking uploads
- **Multi-user support** — Complete data isolation between users
