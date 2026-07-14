import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider,
  AnalyzeImagesInput,
  ConditionAnalysis,
  CONDITION_PROMPT,
} from './ai-provider.interface';
import { parseConditionJson } from './http-vision.helper';

/** Provider local via Ollama (ex.: LLaVA para visão). */
@Injectable()
export class LocalProvider implements AiProvider {
  readonly name = 'local';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    // considerado configurado quando explicitamente selecionado via AI_PROVIDER
    return (this.config.get<string>('ai.provider') ?? '').includes('local');
  }

  private get baseUrl(): string {
    return this.config.get<string>('ai.ollamaBaseUrl') ?? 'http://localhost:11434';
  }

  private async generate(prompt: string, images?: string[]): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.get<string>('ai.ollamaModel'),
        prompt,
        images,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as any;
    return body.response ?? '';
  }

  async analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis> {
    const images = await Promise.all(
      input.imageUrls.map(async (url) => {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer()).toString('base64');
      }),
    );
    const raw = await this.generate(
      CONDITION_PROMPT(input.product.name, input.imageUrls.length),
      images,
    );
    return parseConditionJson(raw, this.name);
  }

  async complete(prompt: string): Promise<string> {
    return this.generate(prompt);
  }
}
