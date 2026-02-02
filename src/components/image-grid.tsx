import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ImageStatus = "PROCESSING" | "READY" | "FAILED";

export interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  description?: string | null;
  tags?: string[];
  width?: number | null;
  height?: number | null;
  status: ImageStatus;
  createdAt: string;
}

interface ImageGridProps {
  images: GalleryImage[];
  onImageClick?: (image: GalleryImage) => void;
  onImageDelete?: (image: GalleryImage) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  emptyMessage?: string;
}

export function ImageGrid({
  images,
  onImageClick,
  onImageDelete,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  emptyMessage = "No images yet",
}: ImageGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleSelection = (imageId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    onSelectionChange?.(newSelection);
  };

  if (images.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-muted-fg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary transition-shadow hover:shadow-lg"
          onMouseEnter={() => setHoveredId(image.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Checkbox for selection */}
          {selectable && (
            <div
              className="absolute left-2 top-2 z-10"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(image.id);
              }}
            >
              <div
                className={`h-5 w-5 rounded border-2 transition-colors ${
                  selectedIds.has(image.id)
                    ? "border-primary bg-primary"
                    : "border-white bg-white/50 hover:bg-white/80"
                } flex items-center justify-center shadow-sm`}
              >
                {selectedIds.has(image.id) && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Image */}
          <img
            src={image.thumbnailUrl}
            alt={image.description || image.filename}
            className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
            onClick={() => onImageClick?.(image)}
            loading="lazy"
          />

          {/* Status badge for processing/failed */}
          {image.status !== "READY" && (
            <div
              className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                image.status === "PROCESSING"
                  ? "bg-warning/90 text-warning-fg"
                  : "bg-danger/90 text-danger-fg"
              }`}
            >
              {image.status === "PROCESSING" ? "Processing" : "Failed"}
            </div>
          )}

          {/* Overlay with actions on hover */}
          {hoveredId === image.id && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
              <p className="truncate text-sm font-medium text-white">
                {image.filename}
              </p>
              {image.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-white/80">
                  {image.description}
                </p>
              )}
              {onImageDelete && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    intent="danger"
                    className="h-7 px-2 text-xs"
                    onPress={() => onImageDelete(image)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
