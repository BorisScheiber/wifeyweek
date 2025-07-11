import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import App from "./App.tsx";

// QueryClient Setup mit Default Options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (früher cacheTime)
    },
  },
});

console.log("QueryClient initialized");

createRoot(document.getElementById("root")!).render(
  
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools nur in Development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  
);
