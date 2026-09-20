"use client";

import { useState } from "react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "@coifyn/ui";
import { errorMessage } from "../lib/error-message";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Every failed write surfaces as a toast (permission errors included);
        // a mutation can opt out with `meta: { silent: true }` when it renders
        // its own error state.
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silent) return;
            toast.error(errorMessage(error));
          },
        }),
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
