"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@coifyn/ui";
import { formatMoney } from "@coifyn/shared";
import { listCustomers } from "../../../lib/api/customers/list-customers";
import { PageHeader } from "../../../shared/components/PageHeader";

export function CustomerList() {
  const [search, setSearch] = useState("");
  const customers = useQuery({
    queryKey: ["customers", search],
    queryFn: () => listCustomers(search || undefined),
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <PageHeader title="Customers">
        <Input
          className="w-64"
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </PageHeader>
      <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
        {(customers.data ?? []).map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center justify-between p-3 text-sm hover:bg-[var(--color-muted)]">
            <span>
              <span className="font-medium">{c.name}</span> · {c.phone}
            </span>
            <span className="text-[var(--color-muted-foreground)]">
              {c.visitCount} visits · {formatMoney(c.totalSpendMinor)}
            </span>
          </Link>
        ))}
        {customers.data?.length === 0 ? <p className="p-3 text-sm">No customers found.</p> : null}
      </div>
    </main>
  );
}
