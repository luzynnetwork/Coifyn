"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@coifyn/ui";

const NAV_ITEMS = [
  { href: "/setup", label: "Setup" },
  { href: "/services", label: "Services" },
  { href: "/team", label: "Team" },
  { href: "/stylists", label: "Stylists" },
  { href: "/queue", label: "Queue" },
  { href: "/pos", label: "POS" },
  { href: "/reports", label: "Reports" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-[var(--color-border)] p-4">
      <span className="mb-4 px-2 text-sm font-semibold">Coifyn</span>
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href) ?? false;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-1.5 text-sm",
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "hover:bg-[var(--color-muted)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
