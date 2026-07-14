export interface ConditionFinding {
  type:
    | 'risco'
    | 'arranhao'
    | 'tela_quebrada'
    | 'oxidacao'
    | 'amassado'
    | 'desgaste'
    | 'sujeira';
  severity: number; // 0–1
  location: string;
  confidence: number; // 0–1
  photoIndex?: number;
}

export interface ConditionAnalysis {
  overallScore: number; // 0–10
  summary: string; // relatório em pt-BR
  findings: ConditionFinding[];
  perPhoto: Array<{ index: number; score: number; findings: ConditionFinding[] }>;
  provider: string;
}

export interface AnalyzeImagesInput {
  imageUrls: string[];
  /** contexto do produto para o prompt */
  product: { name: string; category: string; declaredCondition: string };
  /** semente determinística (id da avaliação) — usada pelo mock */
  seed: string;
}

export interface AiProvider {
  readonly name: string;
  isConfigured(): boolean;
  analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis>;
  complete(prompt: string): Promise<string>;
}

export const CONDITION_PROMPT = (product: string, n: number): string =>
  `Você é um avaliador profissional de produtos usados. Analise as ${n} fotos de "${product}" ` +
  `e responda APENAS com JSON válido no formato: {"findings":[{"type":"risco|arranhao|tela_quebrada|oxidacao|amassado|desgaste|sujeira",` +
  `"severity":0.0,"location":"...","confidence":0.0,"photoIndex":0}],"overallScore":0.0,"summary":"relatório em português do Brasil"}. ` +
  `overallScore vai de 0 (destruído) a 10 (impecável).`;
