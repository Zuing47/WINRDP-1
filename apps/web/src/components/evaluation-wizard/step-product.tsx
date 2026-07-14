"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/category-grid";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrands, useCategories, useModels } from "@/hooks/use-queries";
import type { Brand, Category, Model } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ProductSelection {
  category: Category | null;
  brand: Brand | null;
  model: Model | null;
  year: number | null;
}

export function StepProduct({
  value,
  onChange,
}: {
  value: ProductSelection;
  onChange: (next: ProductSelection) => void;
}) {
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: brands, isLoading: loadingBrands } = useBrands(value.category?.id);
  const [search, setSearch] = useState("");
  const { data: models, isLoading: loadingModels } = useModels(value.brand?.id, search);

  const years = useMemo(() => {
    const base = value.model?.releaseYear ?? new Date().getFullYear();
    const nowYear = new Date().getFullYear();
    const start = base;
    const end = nowYear;
    const list: number[] = [];
    for (let y = end; y >= start; y--) list.push(y);
    if (list.length === 0) list.push(nowYear);
    return list;
  }, [value.model]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium">1. Categoria</h3>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Selecione o tipo de produto</p>
        {loadingCategories || !categories ? (
          <CategoryGridSkeleton />
        ) : (
          <CategoryGrid
            categories={categories}
            selectedId={value.category?.id}
            onSelect={(category) =>
              onChange({ category, brand: null, model: null, year: null })
            }
          />
        )}
      </div>

      {value.category && (
        <FadeIn>
          <h3 className="text-sm font-medium">2. Marca</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Marcas disponíveis em {value.category.name}
          </p>
          {loadingBrands || !brands ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : (
            <Stagger className="flex flex-wrap gap-2" gap={0.02}>
              {brands.map((brand) => (
                <StaggerItem key={brand.id}>
                  <Button
                    type="button"
                    variant={value.brand?.id === brand.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChange({ ...value, brand, model: null, year: null })}
                  >
                    {brand.name}
                  </Button>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </FadeIn>
      )}

      {value.brand && (
        <FadeIn>
          <h3 className="text-sm font-medium">3. Modelo</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Busque o modelo exato do produto</p>
          <div className="relative mb-3 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ex.: iPhone 15 Pro"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loadingModels || !models ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : models.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum modelo encontrado.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onChange({ ...value, model, year: model.releaseYear })}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-700",
                    value.model?.id === model.id && "border-primary ring-1 ring-primary"
                  )}
                >
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.releaseYear}</span>
                </button>
              ))}
            </div>
          )}
        </FadeIn>
      )}

      {value.model && (
        <FadeIn>
          <h3 className="text-sm font-medium">4. Ano da unidade</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Ano de fabricação/compra deste item</p>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <Button
                key={y}
                type="button"
                variant={value.year === y ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...value, year: y })}
              >
                {y}
              </Button>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
