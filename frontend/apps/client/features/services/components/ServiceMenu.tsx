"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@coifyn/ui";
import { listServices } from "../../../lib/api/services/list-services";
import { listServiceCategories } from "../../../lib/api/service-categories/list-service-categories";
import { CategoryList } from "./CategoryList";
import { ServiceTable } from "./ServiceTable";
import { ServiceForm } from "./ServiceForm";
import { AddOnList } from "./AddOnList";

export function ServiceMenu() {
  const categoriesQuery = useQuery({
    queryKey: ["service-categories"],
    queryFn: listServiceCategories,
  });
  const servicesQuery = useQuery({ queryKey: ["services"], queryFn: listServices });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const categories = categoriesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const visibleServices = selectedCategoryId
    ? services.filter((service) => service.categoryId === selectedCategoryId)
    : services;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Service menu</h1>
        <Button onClick={() => setFormOpen(true)}>Add service</Button>
      </div>

      <CategoryList
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <ServiceTable services={visibleServices} categories={categories} />

      <AddOnList />

      <ServiceForm
        mode="create"
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
      />
    </main>
  );
}
