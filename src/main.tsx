import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: "https://2110fe70d3740c1afbf80b6cf36c6d23@o4510791492567040.ingest.us.sentry.io/4510791495450624",
  environment: "production",
});

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
