import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./client/src", import.meta.url)) + "/" },
      { find: "@shared", replacement: fileURLToPath(new URL("./shared", import.meta.url)) + "/" },
      { find: "@assets", replacement: fileURLToPath(new URL("./attached_assets", import.meta.url)) + "/" },
    ],
  },
  root: fileURLToPath(new URL("./client", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("./dist/public", import.meta.url)),
    emptyOutDir: true,
  },
});
