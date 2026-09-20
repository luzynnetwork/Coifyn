"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffMemberView } from "@coifyn/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast,
} from "@coifyn/ui";
import { updateStaff } from "../../../lib/api/staff/update-staff";

export interface DeactivateStaffDialogProps {
  member: StaffMemberView;
}

/** Deactivates a staff login (PATCH /staff/:userId { active: false }). */
export function DeactivateStaffDialog({ member }: DeactivateStaffDialogProps) {
  const queryClient = useQueryClient();
  const deactivate = useMutation({
    mutationFn: () => updateStaff(member.userId, { active: false }),
    onSuccess: () => {
      toast.success("Staff member deactivated");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Deactivate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {member.displayName ?? member.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            They will no longer be able to sign in. The last Owner of a salon cannot be
            deactivated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deactivate.mutate()}>Deactivate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
