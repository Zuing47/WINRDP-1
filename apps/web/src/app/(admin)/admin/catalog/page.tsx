"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL } from "@/lib/format";
import { api } from "@/lib/api";
import { useAllBrands, useAllModels } from "@/hooks/use-admin-queries";
import { useCategories } from "@/hooks/use-queries";
import type { Brand, Category, Model } from "@/lib/types";

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Catálogo" description="Categorias, marcas e modelos disponíveis para avaliação" />
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="brands">Marcas</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="brands">
          <BrandsTab />
        </TabsContent>
        <TabsContent value="models">
          <ModelsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab() {
  const { data: categories, isLoading } = useCategories();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    await api.adminCreateCategory({ name, icon: "Package" });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Categoria criada!");
    setName("");
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await api.adminDeleteCategory(id);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Categoria removida");
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-end border-b p-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Nova categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Instrumentos musicais" />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="divide-y">
          {isLoading || !categories
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))
            : categories.map((c: Category) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CategoryIcon name={c.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Depreciação anual: {(c.annualDepreciation * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BrandsTab() {
  const { data: brands, isLoading } = useAllBrands();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const categoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? id;

  async function handleCreate() {
    if (!name.trim() || !categories?.[0]) return;
    await api.adminCreateBrand({ name, categoryIds: [categories[0].id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
    toast.success("Marca criada!");
    setName("");
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await api.adminDeleteBrand(id);
    queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
    toast.success("Marca removida");
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-end border-b p-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Nova marca
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova marca</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Fender" />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="divide-y">
          {isLoading || !brands
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))
            : brands.map((b: Brand) => (
                <div key={b.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {b.categoryIds.map((cid) => (
                        <Badge key={cid} variant="outline" className="text-[10px]">
                          {categoryName(cid)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelsTab() {
  const { data: models, isLoading } = useAllModels();
  const { data: brands } = useAllBrands();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [releaseYear, setReleaseYear] = useState(String(new Date().getFullYear()));
  const [msrp, setMsrp] = useState("");

  const brandName = (id: string) => brands?.find((b) => b.id === id)?.name ?? id;

  async function handleCreate() {
    if (!name.trim() || !brands?.[0]) return;
    await api.adminCreateModel({
      name,
      brandId: brands[0].id,
      categoryId: brands[0].categoryIds[0],
      releaseYear: Number(releaseYear),
      msrp: Number(msrp) || 0,
    });
    queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    toast.success("Modelo criado!");
    setName("");
    setMsrp("");
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await api.adminDeleteModel(id);
    queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    toast.success("Modelo removido");
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-end border-b p-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Novo modelo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo modelo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Galaxy Z Fold 6" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Ano de lançamento</Label>
                    <Input
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preço de lançamento (R$)</Label>
                    <Input type="number" value={msrp} onChange={(e) => setMsrp(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Modelo</th>
                <th className="px-6 py-3 font-medium">Marca</th>
                <th className="px-6 py-3 font-medium">Ano</th>
                <th className="px-6 py-3 font-medium">MSRP</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {isLoading || !models
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-6 py-4" colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : models.map((m: Model) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="px-6 py-3 font-medium">{m.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{brandName(m.brandId)}</td>
                      <td className="px-6 py-3 text-muted-foreground">{m.releaseYear}</td>
                      <td className="money px-6 py-3">{formatBRL(m.msrp)}</td>
                      <td className="px-6 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
