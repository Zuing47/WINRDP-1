import { Injectable } from '@nestjs/common';
import { pick, randBetween, randInt, seededRng } from '../../../common/utils/random';
import {
  AiProvider,
  AnalyzeImagesInput,
  ConditionAnalysis,
  ConditionFinding,
} from './ai-provider.interface';

const FINDING_TYPES: Array<{
  type: ConditionFinding['type'];
  label: string;
  maxSeverity: number;
}> = [
  { type: 'risco', label: 'risco superficial', maxSeverity: 0.4 },
  { type: 'arranhao', label: 'arranhão', maxSeverity: 0.5 },
  { type: 'desgaste', label: 'desgaste de uso', maxSeverity: 0.45 },
  { type: 'sujeira', label: 'sujeira/poeira', maxSeverity: 0.25 },
  { type: 'amassado', label: 'amassado', maxSeverity: 0.7 },
  { type: 'oxidacao', label: 'ponto de oxidação', maxSeverity: 0.6 },
  { type: 'tela_quebrada', label: 'trinca na tela', maxSeverity: 1.0 },
];

const LOCATIONS = [
  'canto superior direito',
  'canto inferior esquerdo',
  'traseira',
  'lateral direita',
  'lateral esquerda',
  'ao redor da câmera',
  'na base',
  'próximo à entrada de carga',
  'na moldura da tela',
  'na tampa',
];

const CONDITION_BIAS: Record<string, number> = {
  NEW: 9.7,
  LIKE_NEW: 9.2,
  GOOD: 8.2,
  FAIR: 6.8,
  POOR: 5.2,
  FOR_PARTS: 2.8,
};

/**
 * Provider determinístico (seed = id da avaliação): gera defeitos
 * plausíveis coerentes com a condição declarada e um relatório em pt-BR.
 */
@Injectable()
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis> {
    const rng = seededRng(`ai:${input.seed}`);
    const photoCount = Math.max(1, input.imageUrls.length);
    const bias = CONDITION_BIAS[input.product.declaredCondition] ?? 8.0;

    const findingCount =
      input.product.declaredCondition === 'NEW'
        ? randInt(rng, 0, 1)
        : randInt(rng, 1, Math.min(5, 1 + Math.round((10 - bias) * 0.7)));

    const findings: ConditionFinding[] = [];
    for (let i = 0; i < findingCount; i++) {
      // condições piores desbloqueiam defeitos mais graves
      const pool = FINDING_TYPES.filter((f) => f.maxSeverity <= 1.1 - bias / 12);
      const kind = pick(rng, pool.length ? pool : FINDING_TYPES.slice(0, 4));
      findings.push({
        type: kind.type,
        severity: Number(randBetween(rng, 0.08, kind.maxSeverity).toFixed(2)),
        location: pick(rng, LOCATIONS),
        confidence: Number(randBetween(rng, 0.72, 0.98).toFixed(2)),
        photoIndex: randInt(rng, 0, photoCount - 1),
      });
    }

    const penalty = findings.reduce((acc, f) => acc + f.severity * 1.6, 0);
    const overallScore = Math.max(
      0.5,
      Math.min(10, Number((bias - penalty + randBetween(rng, -0.2, 0.3)).toFixed(1))),
    );

    const perPhoto = Array.from({ length: photoCount }, (_, index) => {
      const local = findings.filter((f) => f.photoIndex === index);
      const localPenalty = local.reduce((acc, f) => acc + f.severity * 1.6, 0);
      return {
        index,
        score: Math.max(0.5, Number((bias - localPenalty).toFixed(1))),
        findings: local,
      };
    });

    return {
      overallScore,
      summary: this.buildSummary(input.product.name, overallScore, findings),
      findings,
      perPhoto,
      provider: this.name,
    };
  }

  private buildSummary(product: string, score: number, findings: ConditionFinding[]): string {
    const labelOf = (t: ConditionFinding['type']): string =>
      FINDING_TYPES.find((f) => f.type === t)?.label ?? t;
    if (findings.length === 0) {
      return (
        `O ${product} apresenta excelente estado de conservação, sem defeitos visíveis nas fotos analisadas. ` +
        `Superfícies limpas, sem riscos, amassados ou sinais de mau uso. Nota de condição: ${score.toFixed(1)}/10.`
      );
    }
    const parts = findings.map(
      (f) =>
        `${labelOf(f.type)} ${f.severity >= 0.5 ? 'acentuado' : 'leve'} (${f.location})`,
    );
    const graves = findings.filter((f) => f.severity >= 0.5).length;
    return (
      `A análise das fotos do ${product} identificou ${findings.length} apontamento(s): ${parts.join('; ')}. ` +
      (graves > 0
        ? `Há ${graves} item(ns) com maior impacto no valor de revenda. `
        : 'Nenhum dos apontamentos compromete significativamente o funcionamento. ') +
      `No geral o aparelho condiz com o estado declarado. Nota de condição: ${score.toFixed(1)}/10.`
    );
  }

  async complete(prompt: string): Promise<string> {
    const rng = seededRng(`complete:${prompt.slice(0, 64)}`);
    return `Resposta simulada (mock, determinística #${randInt(rng, 1000, 9999)}): análise concluída com base nos dados fornecidos.`;
  }
}
