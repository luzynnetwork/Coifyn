"use client";

import type { StylistView } from "@coifyn/api-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@coifyn/ui";
import { StylistProfileForm } from "./StylistProfileForm";
import { StylistServiceMatrix } from "./StylistServiceMatrix";

export interface StylistDetailSheetProps {
  stylist: StylistView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StylistDetailSheet({ stylist, open, onOpenChange }: StylistDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{stylist?.displayName ?? "Stylist"}</SheetTitle>
        </SheetHeader>
        {stylist ? (
          <div className="flex flex-col gap-6 px-4">
            <StylistProfileForm stylist={stylist} />
            <StylistServiceMatrix stylist={stylist} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
