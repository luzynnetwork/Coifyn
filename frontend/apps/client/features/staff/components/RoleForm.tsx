"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PermissionView, RoleGrant, RoleView } from "@coifyn/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@coifyn/ui";
import { createRole } from "../../../lib/api/roles/create-role";
import { updateRole } from "../../../lib/api/roles/update-role";
import { PermissionPicker } from "./PermissionPicker";

export type RoleFormProps = {
  permissions: PermissionView[];
} & ({ mode: "create"; role?: undefined } | { mode: "edit"; role: RoleView });

export function RoleForm({ mode, role, permissions }: RoleFormProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(role?.name ?? "");
  const [grants, setGrants] = useState<RoleGrant[]>(role?.grants ?? []);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setGrants(role?.grants ?? []);
  }, [open, role]);

  const save = useMutation({
    mutationFn: async () => {
      if (mode === "edit") {
        await updateRole(role.id, { name, grants });
      } else {
        await createRole({ name, grants });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "edit" ? "outline" : "default"} size="sm">
          {mode === "edit" ? "Edit" : "New role"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit role" : "New custom role"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="roleName">Name</Label>
          <Input id="roleName" value={name} onChange={(event) => setName(event.target.value)} />

          <Label>Permissions</Label>
          <PermissionPicker permissions={permissions} grants={grants} onChange={setGrants} />
        </div>
        <DialogFooter>
          <Button disabled={!name || save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
