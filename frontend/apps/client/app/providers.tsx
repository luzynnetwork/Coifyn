"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError } from "@coifyn/api-client";

/** A 401 that survived the server-side refresh means the session is over. */
function endSessionOnUnauthorized(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) {
    window.location.href = "/login";
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: endSessionOnUnauthorized }),
        mutationCache: new MutationCache({ onError: endSessionOnUnauthorized }),
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
