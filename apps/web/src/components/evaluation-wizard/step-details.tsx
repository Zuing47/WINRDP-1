"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { accessoriesByCategorySlug, conditionOptions, ufs } from "@/lib/domain-constants";
import type { Category, Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DetailsValue {
  attributes: Record<string, string>;
  condition: Condition;
  hasInvoice: boolean;
  hasWarranty: boolean;
  accessories: string[];
  city: string;
  state: string;
}

export function StepDetails({
  category,
  value,
  onChange,
}: {
  category: Category;
  value: DetailsValue;
  onChange: (next: DetailsValue) => void;
}) {
  const accessories = accessoriesByCategorySlug[category.slug] ?? [];

  return (
    <div className="space-y-8">
      {category.attributes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium">Atributos</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Detalhes específicos da categoria</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.attributes.map((attr) => (
              <div key={attr.key} className="space-y-1.5">
                <Label>{attr.label}</Label>
                <Select
                  value={value.attributes[attr.key] ?? ""}
                  onValueChange={(v) =>
                    onChange({ ...value, attributes: { ...value.attributes, [attr.key]: v } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {attr.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium">Estado de conservação</h3>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Escolha a condição que melhor descreve o item
        </p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {conditionOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, condition: opt.value })}
              className={cn(
                "rounded-md border p-3.5 text-left transition-colors hover:border-zinc-300 dark:hover:border-zinc-700",
                value.condition === opt.value && "border-primary ring-1 ring-primary"
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">Possui nota fiscal</p>
            <p className="text-xs text-muted-foreground">Aumenta a confiança da avaliação</p>
          </div>
          <Switch
            checked={value.hasInvoice}
            onCheckedChange={(v) => onChange({ ...value, hasInvoice: v })}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">Ainda está na garantia</p>
            <p className="text-xs text-muted-foreground">Valoriza o preço final</p>
          </div>
          <Switch
            checked={value.hasWarranty}
            onCheckedChange={(v) => onChange({ ...value, hasWarranty: v })}
          />
        </div>
      </div>

      {accessories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium">Acessórios inclusos</h3>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">Marque tudo que acompanha o produto</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {accessories.map((acc) => (
              <label
                key={acc}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <Checkbox
                  checked={value.accessories.includes(acc)}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...value,
                      accessories: checked
                        ? [...value.accessories, acc]
                        : value.accessories.filter((a) => a !== acc),
                    })
                  }
                />
                {acc}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium">Localização</h3>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Usada para ajustar o preço por região
        </p>
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <div className="space-y-1.5">
            <Label>UF</Label>
            <Select value={value.state} onValueChange={(v) => onChange({ ...value, state: v })}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ufs.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Input
              placeholder="Ex.: São Paulo"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
