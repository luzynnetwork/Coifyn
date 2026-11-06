"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError } from "@coifyn/api-client";
import { toast } from "@coifyn/ui";
import { errorMessage } from "../lib/error-message";

/** A 401 that survived the server-side refresh means the session is over. */
function endSessionOnUnauthorized(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 401) {
    window.location.href = "/login";
    return true;
  }
  return false;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: endSessionOnUnauthorized }),
        // Every failed write surfaces as a toast (permission errors included);
        // a mutation can opt out with `meta: { silent: true }` when it renders
        // its own error state. An ended session redirects instead.
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (endSessionOnUnauthorized(error)) return;
            if (mutation.meta?.silent) return;
            toast.error(errorMessage(error));
          },
        }),
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
