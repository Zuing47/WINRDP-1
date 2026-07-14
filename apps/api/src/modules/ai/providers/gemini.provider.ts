import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider,
  AnalyzeImagesInput,
  ConditionAnalysis,
  CONDITION_PROMPT,
} from './ai-provider.interface';
import { parseConditionJson } from './http-vision.helper';

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ai.geminiKey'));
  }

  private async generate(parts: any[]): Promise<string> {
    const model = this.config.get<string>('ai.geminiModel');
    const key = this.config.get<string>('ai.geminiKey');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
      },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as any;
    return (
      body.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
    );
  }

  private async fetchAsInline(url: string): Promise<any> {
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      inline_data: {
        mime_type: res.headers.get('content-type') ?? 'image/jpeg',
        data: buf.toString('base64'),
      },
    };
  }

  async analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis> {
    const images = await Promise.all(input.imageUrls.map((u) => this.fetchAsInline(u)));
    const parts = [
      { text: CONDITION_PROMPT(input.product.name, input.imageUrls.length) },
      ...images,
    ];
    const raw = await this.generate(parts);
    return parseConditionJson(raw, this.name);
  }

  async complete(prompt: string): Promise<string> {
    return this.generate([{ text: prompt }]);
  }
}
