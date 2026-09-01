import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { apiRequest } from "../lib/api/client";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 2, refetchOnWindowFocus: false } },
});

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void apiRequest("/csrf");
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
