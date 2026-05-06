import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base './' keeps assets relative for GitHub Pages project sites.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
