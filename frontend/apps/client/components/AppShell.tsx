"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/login") ?? false;

  if (isAuthRoute) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
