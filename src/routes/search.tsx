import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: "/search",
        },
      });
    }
  },
  component: SearchPage,
});

interface SearchResult {
  id: string;
  score: number;
  url: string;
  thumbnailUrl: string;
  description: string;
  tags: string[];
  filename: string;
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/images/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Search failed");
      }
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Search Images</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for images..."
          className="flex-1 rounded-lg border border-input bg-bg px-4 py-2 text-fg placeholder:text-muted-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <Button type="submit" isDisabled={isSearching || !query.trim()}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-medium">
            Results ({results.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {results.map((result) => (
              <a
                key={result.id}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-lg"
              >
                <img
                  src={result.thumbnailUrl}
                  alt={result.description}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="p-2">
                  <p className="text-xs text-muted-fg line-clamp-2">
                    {result.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg/60">
                    Score: {(result.score * 100).toFixed(1)}%
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && query && !isSearching && !error && (
        <p className="mt-8 text-center text-muted-fg">
          No results found for "{query}"
        </p>
      )}
    </div>
  );
}
