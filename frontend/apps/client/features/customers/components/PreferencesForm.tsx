"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPreferences, updateConsent, updatePreferences, getConsent } from "@coifyn/api-client";
import { Button, Input, Label, Switch, toast } from "@coifyn/ui";

export function PreferencesForm({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const prefs = useQuery({ queryKey: ["preferences", customerId], queryFn: () => getPreferences(customerId) });
  const consent = useQuery({ queryKey: ["consent", customerId], queryFn: () => getConsent(customerId) });

  const [drink, setDrink] = useState("");
  const [level, setLevel] = useState("");
  useEffect(() => {
    setDrink(prefs.data?.drink ?? "");
    setLevel(prefs.data?.conversationLevel ?? "");
  }, [prefs.data]);

  const save = useMutation({
    mutationFn: () =>
      updatePreferences(customerId, {
        drink: drink || undefined,
        conversationLevel: level || undefined,
      }),
    onSuccess: () => {
      toast.success("Preferences saved");
      return queryClient.invalidateQueries({ queryKey: ["preferences", customerId] });
    },
  });

  const marketing = consent.data?.some(
    (c) => c.channel === "sms" && c.purpose === "marketing" && c.status === "granted",
  );
  const toggle = useMutation({
    mutationFn: (granted: boolean) =>
      updateConsent(customerId, {
        channel: "sms",
        purpose: "marketing",
        status: granted ? "granted" : "revoked",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consent", customerId] }),
  });

  return (
    <div className="flex max-w-md flex-col gap-3">
      <Label htmlFor="drink">Usual drink</Label>
      <Input id="drink" value={drink} onChange={(e) => setDrink(e.target.value)} />
      <Label htmlFor="level">Conversation (chatty / some / quiet)</Label>
      <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} />
      <Button className="w-fit" disabled={save.isPending} onClick={() => save.mutate()}>
        Save preferences
      </Button>
      <div className="mt-4 flex items-center gap-3">
        <Switch checked={Boolean(marketing)} onCheckedChange={(v) => toggle.mutate(v)} id="mk" />
        <Label htmlFor="mk">Marketing messages by SMS (reminders always send)</Label>
      </div>
    </div>
  );
}
