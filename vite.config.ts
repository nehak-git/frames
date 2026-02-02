import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    nitro({
      preset: "bun",
      serverDir: ".",
      apiDir: "./src/server",
      experimental: {
        tasks: true,
        vite: {},
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
