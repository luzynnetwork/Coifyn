"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@coifyn/ui";
import { getSalon } from "../../../lib/api/salon/get-salon";
import { updateSalon } from "../../../lib/api/salon/update-salon";
import { updateBranch } from "../../../lib/api/branches/update-branch";
import { listBranches } from "../../../lib/api/branches/list-branches";

export interface BranchInfoTabProps {
  branchId: string;
}

export function BranchInfoTab({ branchId }: BranchInfoTabProps) {
  const queryClient = useQueryClient();
  const salonQuery = useQuery({ queryKey: ["salon"], queryFn: getSalon });
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const branch = branchesQuery.data?.find((b) => b.id === branchId);

  const [brandName, setBrandName] = useState("");
  const [branchName, setBranchName] = useState("");

  useEffect(() => {
    if (salonQuery.data) setBrandName(salonQuery.data.brandName);
  }, [salonQuery.data]);
  useEffect(() => {
    if (branch) setBranchName(branch.name);
  }, [branch]);

  const saveSalon = useMutation({
    mutationFn: () => updateSalon({ brandName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salon"] }),
  });
  const saveBranch = useMutation({
    mutationFn: () => updateBranch(branchId, { name: branchName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Salon brand</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="brandName">Brand name</Label>
          <Input
            id="brandName"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
          />
          <Button
            className="w-fit"
            disabled={saveSalon.isPending}
            onClick={() => saveSalon.mutate()}
          >
            Save brand
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branch</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="branchName">Branch name</Label>
          <Input
            id="branchName"
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
          />
          <Button
            className="w-fit"
            disabled={saveBranch.isPending}
            onClick={() => saveBranch.mutate()}
          >
            Save branch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
