import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2019",
    outExtension({ format }) {
      return { js: format === "cjs" ? ".cjs" : ".js" };
    },
  },
  {
    entry: { index: "src/index.ts" },
    format: ["iife"],
    globalName: "PaganelUI",
    outExtension: () => ({ js: ".global.js" }),
    minify: true,
    dts: false,
    clean: false,
    target: "es2019",
  },
]);
