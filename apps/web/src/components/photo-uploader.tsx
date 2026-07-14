"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Lightbulb, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface LocalPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

const TIPS = [
  "Frente e verso do produto",
  "Detalhes de cantos e bordas",
  "Tela/display ligado",
  "Acessórios e caixa",
  "Qualquer defeito de perto",
];

export function PhotoUploader({
  photos,
  onChange,
  max = 15,
}: {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      const room = max - photos.length;
      if (room <= 0) {
        toast.warning(`Limite de ${max} fotos atingido.`);
        return;
      }
      const accepted = images.slice(0, room).map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      if (images.length > room) toast.warning(`Apenas ${room} foto(s) adicionada(s) — limite de ${max}.`);
      onChange([...photos, ...accepted]);
    },
    [photos, onChange, max]
  );

  const remove = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-zinc-300 dark:hover:border-zinc-700"
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
        </span>
        <p className="mt-3 text-sm font-medium">
          Arraste fotos aqui ou <span className="text-primary">clique para selecionar</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG ou JPG · até {max} fotos · {photos.length}/{max} adicionadas
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          <AnimatePresence>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                className="group relative aspect-square overflow-hidden rounded-md border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Foto ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => remove(photo.id)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {i + 1}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="text-sm">
          <p className="font-medium">O que fotografar</p>
          <p className="mt-1 text-muted-foreground">
            {TIPS.join(" · ")}. Quanto mais nítidas as fotos, maior a confiança da avaliação.
          </p>
        </div>
      </div>
    </div>
  );
}
