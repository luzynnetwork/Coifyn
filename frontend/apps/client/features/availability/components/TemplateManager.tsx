"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyShiftTemplate,
  createShiftTemplate,
  listShiftTemplates,
  type PatternEntry,
} from "@coifyn/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@coifyn/ui";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { addDays, todayString, WEEKDAY_NAMES } from "../../../shared/lib/dates";

export function TemplateManager({ branchId }: { branchId: string }) {
  const queryClient = useQueryClient();
  const stylists = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const templates = useQuery({ queryKey: ["shift-templates"], queryFn: listShiftTemplates });

  const [stylistId, setStylistId] = useState("");
  const [name, setName] = useState("Standard week");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const create = useMutation({
    mutationFn: () => {
      const pattern: PatternEntry[] = days.map((weekday) => ({ weekday, start, end }));
      return createShiftTemplate({ stylistId, name, pattern });
    },
    onSuccess: () => {
      toast.success("Template saved");
      return queryClient.invalidateQueries({ queryKey: ["shift-templates"] });
    },
  });

  const apply = useMutation({
    mutationFn: (id: string) =>
      applyShiftTemplate(id, { from: todayString(), to: addDays(todayString(), 27) }),
    onSuccess: (result) => {
      toast.success(`${result.created} shifts created`);
      return queryClient.invalidateQueries({ queryKey: ["roster"] });
    },
  });

  const mine = (stylists.data ?? []).filter((s) => s.branchId === branchId);
  const names = new Map(mine.map((s) => [s.id, s.displayName]));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>New weekly template</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label>Stylist</Label>
          <Select value={stylistId} onValueChange={setStylistId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a stylist" />
            </SelectTrigger>
            <SelectContent>
              {mine.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="tplName">Name</Label>
          <Input id="tplName" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_NAMES.map((label, weekday) => (
              <Button
                key={label}
                size="sm"
                variant={days.includes(weekday) ? "default" : "outline"}
                onClick={() =>
                  setDays((d) => (d.includes(weekday) ? d.filter((x) => x !== weekday) : [...d, weekday]))
                }
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={!stylistId || days.length === 0 || start >= end || create.isPending}
          >
            Save template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(templates.data ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {t.name} · {names.get(t.stylistId) ?? "Stylist"} ·{" "}
                {t.pattern.map((p) => WEEKDAY_NAMES[p.weekday]).join(" ")}
              </span>
              <Button size="sm" variant="outline" disabled={apply.isPending} onClick={() => apply.mutate(t.id)}>
                Roster next 4 weeks
              </Button>
            </div>
          ))}
          {templates.data?.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No templates yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
