import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import schema from "./schemas/proof-map.v1.schema.json";
import example from "./examples/statistical-estimation.graph.json";

export default defineConfig({
  base: "/proof-map/",
  plugins: [
    react(),
    {
      name: "canonical-graph-artifacts",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "schemas/proof-map.v1.schema.json",
          source: JSON.stringify(schema, null, 2),
        });
        this.emitFile({
          type: "asset",
          fileName: "examples/statistical-estimation.graph.json",
          source: JSON.stringify(example, null, 2),
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "graph-view": ["@xyflow/react"],
          math: ["katex"],
        },
      },
    },
  },
});
