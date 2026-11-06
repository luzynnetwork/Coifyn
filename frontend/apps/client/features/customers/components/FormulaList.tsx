"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFormula, listFormulas } from "@coifyn/api-client";
import { Badge, Button, Input } from "@coifyn/ui";

export function FormulaList({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const formulas = useQuery({ queryKey: ["formulas", customerId], queryFn: () => listFormulas(customerId) });
  const [formula, setFormula] = useState("");
  const [developer, setDeveloper] = useState("");

  const add = useMutation({
    mutationFn: () =>
      createFormula({ customerId, kind: "color", formula, developer: developer || undefined }),
    onSuccess: () => {
      setFormula("");
      setDeveloper("");
      return queryClient.invalidateQueries({ queryKey: ["formulas", customerId] });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Input className="w-72" placeholder="Colour formula e.g. 6N + 7A 1:1" value={formula} onChange={(e) => setFormula(e.target.value)} />
        <Input className="w-32" placeholder="Developer" value={developer} onChange={(e) => setDeveloper(e.target.value)} />
        <Button disabled={!formula.trim() || add.isPending} onClick={() => add.mutate()}>
          Add formula
        </Button>
      </div>
      {(formulas.data ?? []).map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-md border border-[var(--color-border)] p-2 text-sm">
          <Badge variant="secondary">{f.kind}</Badge>
          <span>{f.formula}</span>
          {f.developer ? <span className="text-[var(--color-muted-foreground)]">dev {f.developer}</span> : null}
        </div>
      ))}
    </div>
  );
}
