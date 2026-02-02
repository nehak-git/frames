import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ImageGrid, type GalleryImage, type ImageStatus } from "@/components/image-grid";
import { Button } from "@/components/ui/button";
import { getAuthState } from "@/lib/auth-client";

export const Route = createFileRoute("/gallery")({
  beforeLoad: async ({ location }) => {
    const auth = await getAuthState();
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: GalleryPage,
});

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ImagesResponse {
  images: GalleryImage[];
  pagination: PaginationInfo;
}

function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ImageStatus | "ALL">("ALL");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchImages = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        if (statusFilter !== "ALL") {
          params.set("status", statusFilter);
        }

        const response = await fetch(`/api/images?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }

        const data: ImagesResponse = await response.json();
        setImages(data.images);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load images");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(`Are you sure you want to delete "${image.filename}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Remove from local state
      setImages((prev) => prev.filter((img) => img.id !== image.id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Gallery</h1>
          {pagination && (
            <p className="mt-1 text-sm text-muted-fg">
              {pagination.total} image{pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ImageStatus | "ALL")}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="ALL">All Images</option>
            <option value="READY">Ready</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>

          <Link to="/upload">
            <Button intent="primary" size="sm">
              Upload
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-danger/10 p-4 text-sm text-danger">
          {error}
          <button
            onClick={() => fetchImages()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <div className="text-muted-fg">Loading images...</div>
        </div>
      ) : (
        <>
          <ImageGrid
            images={images}
            onImageClick={handleImageClick}
            onImageDelete={handleDelete}
            emptyMessage="No images yet. Upload your first image!"
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                intent="secondary"
                size="sm"
                isDisabled={pagination.page === 1}
                onPress={() => fetchImages(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="px-4 text-sm text-muted-fg">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                intent="secondary"
                size="sm"
                isDisabled={!pagination.hasMore}
                onPress={() => fetchImages(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image detail modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <img
              src={selectedImage.url}
              alt={selectedImage.description || selectedImage.filename}
              className="max-h-[70vh] w-full object-contain"
            />

            <div className="border-t border-border p-4">
              <h3 className="font-medium">{selectedImage.filename}</h3>
              {selectedImage.description && (
                <p className="mt-1 text-sm text-muted-fg">
                  {selectedImage.description}
                </p>
              )}
              {selectedImage.tags && selectedImage.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedImage.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-fg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-fg">
                {selectedImage.width && selectedImage.height && (
                  <span>
                    {selectedImage.width} × {selectedImage.height}
                  </span>
                )}
                <span>
                  {new Date(selectedImage.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 ${
                    selectedImage.status === "READY"
                      ? "bg-success/10 text-success"
                      : selectedImage.status === "PROCESSING"
                        ? "bg-warning/10 text-warning"
                        : "bg-danger/10 text-danger"
                  }`}
                >
                  {selectedImage.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-bg p-6 text-center">
            <div className="text-muted-fg">Deleting image...</div>
          </div>
        </div>
      )}
    </div>
  );
}
