import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8788,
    // Add this line here:
    allowedHosts: ["biowith.mskifah.com"], 
    proxy: {
      '/api': 'http://localhost:3001',
    }, // Fixed the "]" typo that was here
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
