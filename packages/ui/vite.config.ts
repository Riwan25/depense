import path from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "vite-plus";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  pack: {
    exports: {
      customExports: {
        "./index.css": "./index.css",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
  },
});
