import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import ClerkTokenProvider from './components/auth/ClerkTokenProvider';
import "./i18n";
import "./index.css";
import App from "./App.jsx";

// Expose devSeeder on window for demo/testing in development
if (import.meta.env.MODE !== "production") {
  import("./utils/devSeeder.js").then(devSeeder => {
    window.__devSeeder = window.__devSeeder || {};
    Object.assign(window.__devSeeder, devSeeder);
  });
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPubKey || clerkPubKey === "pk_test_replace_me" || clerkPubKey === "pk_test_your_publishable_key") {
  throw new Error('Clerk publishable key is missing or placeholder. Clerk is required.');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ClerkTokenProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkTokenProvider>
    </ClerkProvider>
  </StrictMode>,
);
