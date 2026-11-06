import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

/** Title row shared by the Phase 2 screens: heading on the left, controls on the right. */
export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
