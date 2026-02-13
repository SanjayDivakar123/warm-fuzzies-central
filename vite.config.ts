import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Mirror production API routing locally
      // Assumes Supabase CLI serves functions at http://localhost:54321/functions/v1
      "/v1/health": {
        target: "http://localhost:54321",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/v1\/health/, "/functions/v1/api-gateway/health"),
      },
      "/v1/users": {
        target: "http://localhost:54321",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/v1\/users/, "/functions/v1/api-users/users"),
      },
      "/v1/assessments": {
        target: "http://localhost:54321",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/v1\/assessments/, "/functions/v1/api-assessments/assessments"),
      },
      // Fallback for any other /v1/* to api-gateway
      "/v1/": {
        target: "http://localhost:54321",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/v1\//, "/functions/v1/api-gateway/"),
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
