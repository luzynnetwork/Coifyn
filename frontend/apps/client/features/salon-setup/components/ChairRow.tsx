"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChairView } from "@coifyn/api-client";
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
  Badge,
  Button,
  TableCell,
  TableRow,
} from "@coifyn/ui";
import { retireChair } from "../../../lib/api/chairs/retire-chair";

export interface ChairRowProps {
  branchId: string;
  chair: ChairView;
}

export function ChairRow({ branchId, chair }: ChairRowProps) {
  const queryClient = useQueryClient();
  const retire = useMutation({
    mutationFn: () => retireChair(chair.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chairs", branchId] }),
  });

  return (
    <TableRow>
      <TableCell>{chair.label}</TableCell>
      <TableCell>
        <Badge variant={chair.isActive ? "default" : "secondary"}>
          {chair.isActive ? "Active" : "Retired"}
        </Badge>
      </TableCell>
      <TableCell>
        {chair.isActive ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Retire
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retire {chair.label}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This chair will no longer be schedulable. This can&apos;t be undone from here.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => retire.mutate()}>Retire</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
