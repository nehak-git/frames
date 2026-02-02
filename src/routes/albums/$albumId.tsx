import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ImageGrid, type GalleryImage } from "@/components/image-grid";
import { Button } from "@/components/ui/button";
import { getAuthState } from "@/lib/auth-client";

export const Route = createFileRoute("/albums/$albumId")({
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
  component: AlbumDetailPage,
});

interface Album {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  images: (GalleryImage & { order: number })[];
}

function AlbumDetailPage() {
  const { albumId } = Route.useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const fetchAlbum = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/albums/${albumId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Album not found");
        }
        throw new Error("Failed to fetch album");
      }

      const data: Album = await response.json();
      setAlbum(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load album");
    } finally {
      setIsLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  const handleSaveEdit = async () => {
    if (!album || !editName.trim()) return;

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update album");
      }

      setAlbum({
        ...album,
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update album");
    }
  };

  const handleRemoveImage = async (image: GalleryImage) => {
    if (!album) return;

    if (!confirm(`Remove "${image.filename}" from this album?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: [image.id] }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove image");
      }

      setAlbum({
        ...album,
        images: album.images.filter((img) => img.id !== image.id),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove image");
    }
  };

  const handleDeleteAlbum = async () => {
    if (!album) return;

    if (!confirm(`Are you sure you want to delete "${album.name}"? This will not delete the images.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete album");
      }

      navigate({ to: "/albums" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-fg">Loading album...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg bg-danger/10 p-6 text-center">
          <p className="text-danger">{error || "Album not found"}</p>
          <Link to="/albums" className="mt-4 inline-block text-sm underline">
            Back to Albums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/albums"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-fg hover:text-fg"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Albums
        </Link>

        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring/50"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add a description..."
              rows={2}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <div className="flex gap-2">
              <Button size="sm" intent="primary" onPress={handleSaveEdit}>
                Save
              </Button>
              <Button size="sm" intent="secondary" onPress={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{album.name}</h1>
              {album.description && (
                <p className="mt-1 text-muted-fg">{album.description}</p>
              )}
              <p className="mt-2 text-sm text-muted-fg">
                {album.images.length} image{album.images.length !== 1 ? "s" : ""}
                {album.isPublic && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Public
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" intent="secondary" onPress={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button size="sm" intent="primary" onPress={() => setIsAddingImages(true)}>
                Add Images
              </Button>
              <Button size="sm" intent="danger" onPress={handleDeleteAlbum}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Images Grid */}
      <ImageGrid
        images={album.images}
        onImageClick={(img) => setSelectedImage(img)}
        onImageDelete={handleRemoveImage}
        emptyMessage="No images in this album yet"
      />

      {/* Add Images Modal */}
      {isAddingImages && (
        <AddImagesModal
          albumId={albumId}
          existingImageIds={album.images.map((img) => img.id)}
          onClose={() => setIsAddingImages(false)}
          onImagesAdded={(count) => {
            setIsAddingImages(false);
            fetchAlbum(); // Refresh to get updated images
          }}
        />
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.description || selectedImage.filename}
              className="max-h-[80vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AddImagesModal({
  albumId,
  existingImageIds,
  onClose,
  onImagesAdded,
}: {
  albumId: string;
  existingImageIds: string[];
  onClose: () => void;
  onImagesAdded: (count: number) => void;
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images?limit=100&status=READY");
        if (!response.ok) throw new Error("Failed to fetch images");
        const data = await response.json();
        // Filter out images already in the album
        const existingSet = new Set(existingImageIds);
        setImages(data.images.filter((img: GalleryImage) => !existingSet.has(img.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load images");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [existingImageIds]);

  const handleAddImages = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error("Failed to add images");
      }

      const result = await response.json();
      onImagesAdded(result.added);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add images");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg bg-bg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Add Images to Album</h2>
          <button onClick={onClose} className="text-muted-fg hover:text-fg">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <div className="text-muted-fg">Loading images...</div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</div>
          ) : images.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center">
              <p className="text-muted-fg">No more images to add</p>
            </div>
          ) : (
            <ImageGrid
              images={images}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-4">
          <span className="text-sm text-muted-fg">
            {selectedIds.size} image{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button intent="secondary" onPress={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              intent="primary"
              onPress={handleAddImages}
              isDisabled={selectedIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? "Adding..." : `Add ${selectedIds.size} Image${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
