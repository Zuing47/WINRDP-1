"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StepDetails, type DetailsValue } from "@/components/evaluation-wizard/step-details";
import { StepProcessing } from "@/components/evaluation-wizard/step-processing";
import { StepProduct, type ProductSelection } from "@/components/evaluation-wizard/step-product";
import { FadeIn } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { PhotoUploader, type LocalPhoto } from "@/components/photo-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WizardProgress } from "@/components/wizard-progress";
import { api } from "@/lib/api";

const STEP_LABELS = ["Produto", "Detalhes", "Fotos", "Processamento"];

export default function NewEvaluationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  const [product, setProduct] = useState<ProductSelection>({
    category: null,
    brand: null,
    model: null,
    year: null,
  });

  const [details, setDetails] = useState<DetailsValue>({
    attributes: {},
    condition: "GOOD",
    hasInvoice: false,
    hasWarranty: false,
    accessories: [],
    city: "",
    state: "SP",
  });

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  const canAdvanceStep0 = Boolean(product.category && product.brand && product.model && product.year);
  const canAdvanceStep1 = Boolean(details.state && details.city.trim().length > 1);
  const canAdvanceStep2 = photos.length >= 1;

  async function handleSubmit() {
    if (!product.model || !product.year) return;
    setSubmitting(true);
    try {
      const { id } = await api.createEvaluation({
        modelId: product.model.id,
        condition: details.condition,
        year: product.year,
        attributes: details.attributes,
        hasInvoice: details.hasInvoice,
        hasWarranty: details.hasWarranty,
        accessories: details.accessories,
        location: { city: details.city, state: details.state },
        photoCount: photos.length,
      });
      setEvaluationId(id);
      setStep(3);
    } catch {
      toast.error("Não foi possível iniciar a avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Nova avaliação" description="Preencha os dados do produto em 4 passos rápidos" />

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-8">
            <WizardProgress steps={STEP_LABELS} current={step} />
          </div>

          {step === 0 && (
            <FadeIn>
              <StepProduct value={product} onChange={setProduct} />
              <div className="mt-8 flex justify-end">
                <Button disabled={!canAdvanceStep0} onClick={() => setStep(1)}>
                  Continuar
                </Button>
              </div>
            </FadeIn>
          )}

          {step === 1 && product.category && (
            <FadeIn>
              <StepDetails category={product.category} value={details} onChange={setDetails} />
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Voltar
                </Button>
                <Button disabled={!canAdvanceStep1} onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </FadeIn>
          )}

          {step === 2 && (
            <FadeIn>
              <h3 className="mb-1 text-sm font-medium">Fotos do produto</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Envie até 15 fotos — quanto mais completas, mais precisa a avaliação
              </p>
              <PhotoUploader photos={photos} onChange={setPhotos} />
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button disabled={!canAdvanceStep2 || submitting} onClick={handleSubmit}>
                  {submitting ? "Enviando…" : "Concluir e processar"}
                </Button>
              </div>
            </FadeIn>
          )}

          {step === 3 && evaluationId && (
            <StepProcessing
              evaluationId={evaluationId}
              onDone={() => router.push(`/evaluations/${evaluationId}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
