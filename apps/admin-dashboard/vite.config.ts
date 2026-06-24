import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/auth": { target: "http://localhost:3000", changeOrigin: true },
      "/admin": { target: "http://localhost:3000", changeOrigin: true },
      "/me": { target: "http://localhost:3000", changeOrigin: true },
      "/evaluate": { target: "http://localhost:3000", changeOrigin: true },
      "/optimize": { target: "http://localhost:3000", changeOrigin: true },
      "/public": { target: "http://localhost:3000", changeOrigin: true },
      "/health": { target: "http://localhost:3000", changeOrigin: true },
      "/dashboard": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
  preview: {
    port: 4000,
  },
});
