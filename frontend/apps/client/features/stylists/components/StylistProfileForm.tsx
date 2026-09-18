"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StylistView } from "@coifyn/api-client";
import { Button, Input, Label, Switch, Textarea } from "@coifyn/ui";
import { updateStylist } from "../../../lib/api/stylists/update-stylist";

export interface StylistProfileFormProps {
  stylist: StylistView;
}

export function StylistProfileForm({ stylist }: StylistProfileFormProps) {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState(stylist.bio ?? "");
  const [specialties, setSpecialties] = useState(stylist.specialties.join(", "));
  const [isBookable, setIsBookable] = useState(stylist.isBookable);

  useEffect(() => {
    setBio(stylist.bio ?? "");
    setSpecialties(stylist.specialties.join(", "));
    setIsBookable(stylist.isBookable);
  }, [stylist]);

  const save = useMutation({
    mutationFn: () =>
      updateStylist(stylist.id, {
        bio,
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isBookable,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stylists"] }),
  });

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="stylistBio">Bio</Label>
      <Textarea id="stylistBio" value={bio} onChange={(event) => setBio(event.target.value)} />

      <Label htmlFor="stylistSpecialties">Specialties (comma separated)</Label>
      <Input
        id="stylistSpecialties"
        value={specialties}
        onChange={(event) => setSpecialties(event.target.value)}
      />

      <div className="flex items-center gap-2">
        <Switch checked={isBookable} onCheckedChange={setIsBookable} />
        <span className="text-sm">Bookable</span>
      </div>

      <Button className="w-fit" disabled={save.isPending} onClick={() => save.mutate()}>
        Save profile
      </Button>
    </div>
  );
}
