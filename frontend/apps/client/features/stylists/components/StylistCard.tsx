"use client";

import type { StylistView } from "@coifyn/api-client";
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent } from "@coifyn/ui";
import { StatusToggle } from "./StatusToggle";

export interface StylistCardProps {
  stylist: StylistView;
  onOpen: () => void;
}

export function StylistCard({ stylist, onOpen }: StylistCardProps) {
  const initials = stylist.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card className="cursor-pointer" onClick={onOpen}>
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        <Avatar className="size-16">
          {stylist.avatarUrl ? <AvatarImage src={stylist.avatarUrl} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{stylist.displayName}</span>
        <div onClick={(event) => event.stopPropagation()}>
          <StatusToggle stylist={stylist} />
        </div>
      </CardContent>
    </Card>
  );
}
