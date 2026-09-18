"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceCategoryView } from "@coifyn/api-client";
import { Badge, Button, Input } from "@coifyn/ui";
import { createServiceCategory } from "../../../lib/api/service-categories/create-service-category";

export interface CategoryListProps {
  categories: ServiceCategoryView[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryList({ categories, selectedCategoryId, onSelect }: CategoryListProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => createServiceCategory({ name, order: categories.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      setName("");
      setAdding(false);
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={selectedCategoryId === null ? "default" : "secondary"}
        className="cursor-pointer"
        onClick={() => onSelect(null)}
      >
        All
      </Badge>
      {categories.map((category) => (
        <Badge
          key={category.id}
          variant={selectedCategoryId === category.id ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Badge>
      ))}

      {adding ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            className="h-8 w-40"
            value={name}
            placeholder="Category name"
            onChange={(event) => setName(event.target.value)}
          />
          <Button size="sm" disabled={!name || create.isPending} onClick={() => create.mutate()}>
            Add
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          + Category
        </Button>
      )}
    </div>
  );
}
