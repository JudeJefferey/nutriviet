import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Cho phép import "@/lib/..." giống trong Next.js
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
