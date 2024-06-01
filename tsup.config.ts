import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src"],
  outDir: "dist",
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  target: "es2021",
});
