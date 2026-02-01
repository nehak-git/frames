import { createFileRoute, redirect } from "@tanstack/react-router";
import { ImageUpload } from "@/components/image-upload";
import { useState } from "react";

export const Route = createFileRoute("/upload")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: "/upload",
        },
      });
    }
  },
  component: UploadPage,
});

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  description?: string;
  tags?: string[];
}

function UploadPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Upload Images</h1>

      <ImageUpload
        onUploadComplete={(image) => {
          setUploadedImages((prev) => [...prev, image]);
          setError(null);
        }}
        onUploadError={(err) => setError(err)}
      />

      {error && (
        <div className="mt-4 rounded-lg bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-medium">Uploaded Images</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {uploadedImages.map((image) => (
              <a
                key={image.id}
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-lg"
              >
                <img
                  src={image.thumbnailUrl}
                  alt="Uploaded"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                {image.description && (
                  <div className="p-2 text-xs text-muted-fg line-clamp-2">
                    {image.description}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
