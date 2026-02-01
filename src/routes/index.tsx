import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold">Welcome to Frames</h1>
      <p className="mt-4 text-lg text-muted-fg">
        Upload and search your images with AI-powered semantic search.
      </p>
    </div>
  );
}
