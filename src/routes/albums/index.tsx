import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getAuthState } from "@/lib/auth-client";

export const Route = createFileRoute("/albums/")({
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
  component: AlbumsPage,
});

interface Album {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  imageCount: number;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AlbumsResponse {
  albums: Album[];
}

function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/albums");

      if (!response.ok) {
        throw new Error("Failed to fetch albums");
      }

      const data: AlbumsResponse = await response.json();
      setAlbums(data.albums);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load albums");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleAlbumCreated = (newAlbum: Album) => {
    setAlbums((prev) => [newAlbum, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteAlbum = async (album: Album) => {
    if (!confirm(`Are you sure you want to delete "${album.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete album");
      }

      setAlbums((prev) => prev.filter((a) => a.id !== album.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Albums</h1>
          <p className="mt-1 text-sm text-muted-fg">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Button intent="primary" size="sm" onPress={() => setIsCreateModalOpen(true)}>
          New Album
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-danger/10 p-4 text-sm text-danger">
          {error}
          <button
            onClick={() => fetchAlbums()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <div className="text-muted-fg">Loading albums...</div>
        </div>
      ) : albums.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-muted-fg">No albums yet</p>
          <Button
            intent="primary"
            size="sm"
            className="mt-4"
            onPress={() => setIsCreateModalOpen(true)}
          >
            Create your first album
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onDelete={() => handleDeleteAlbum(album)}
            />
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      {isCreateModalOpen && (
        <CreateAlbumModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleAlbumCreated}
        />
      )}
    </div>
  );
}

function AlbumCard({
  album,
  onDelete,
}: {
  album: Album;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-bg transition-shadow hover:shadow-lg">
      <Link to="/albums/$albumId" params={{ albumId: album.id }}>
        {/* Cover Image */}
        <div className="aspect-[4/3] bg-secondary">
          {album.coverImage ? (
            <img
              src={album.coverImage}
              alt={album.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-fg">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Album Info */}
        <div className="p-3">
          <h3 className="font-medium truncate">{album.name}</h3>
          <p className="mt-0.5 text-sm text-muted-fg">
            {album.imageCount} image{album.imageCount !== 1 ? "s" : ""}
          </p>
        </div>
      </Link>

      {/* Menu button */}
      <div className="absolute right-2 top-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-border bg-bg py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-danger hover:bg-secondary"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Public badge */}
      {album.isPublic && (
        <div className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-fg">
          Public
        </div>
      )}
    </div>
  );
}

function CreateAlbumModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (album: Album) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Album name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create album");
      }

      const newAlbum = await response.json();
      onCreated({
        ...newAlbum,
        imageCount: 0,
        coverImage: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create album");
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
        className="w-full max-w-md rounded-lg bg-bg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Create New Album</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <TextField
            label="Album Name"
            value={name}
            onChange={setName}
            placeholder="My Album"
            autoFocus
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">Make this album public</span>
          </label>

          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button intent="secondary" onPress={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" intent="primary" isDisabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Album"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
