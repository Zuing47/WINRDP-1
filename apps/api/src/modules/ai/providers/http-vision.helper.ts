import { ConditionAnalysis, ConditionFinding } from './ai-provider.interface';

/** Extrai o JSON estruturado devolvido pelos LLMs e normaliza a análise. */
export function parseConditionJson(raw: string, provider: string): ConditionAnalysis {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Resposta do provider ${provider} sem JSON válido`);
  const parsed = JSON.parse(match[0]) as {
    findings?: ConditionFinding[];
    overallScore?: number;
    summary?: string;
  };
  const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
  const overallScore = Math.max(0, Math.min(10, Number(parsed.overallScore ?? 7)));
  const perPhotoMap = new Map<number, ConditionFinding[]>();
  for (const f of findings) {
    const idx = f.photoIndex ?? 0;
    perPhotoMap.set(idx, [...(perPhotoMap.get(idx) ?? []), f]);
  }
  return {
    overallScore,
    summary: parsed.summary ?? 'Relatório indisponível.',
    findings,
    perPhoto: [...perPhotoMap.entries()].map(([index, fs]) => ({
      index,
      score: Math.max(0.5, overallScore - fs.reduce((a, f) => a + f.severity, 0)),
      findings: fs,
    })),
    provider,
  };
}
