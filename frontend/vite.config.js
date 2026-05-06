import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use repository base path for GitHub Pages project site.
export default defineConfig({
  plugins: [react()],
  base: "/Captchalogue/",
});
