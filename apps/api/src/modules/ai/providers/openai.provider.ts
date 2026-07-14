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
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ai.openaiKey'));
  }

  private async chat(messages: any[]): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.get<string>('ai.openaiKey')}`,
      },
      body: JSON.stringify({
        model: this.config.get<string>('ai.openaiModel'),
        messages,
        max_tokens: 1500,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as any;
    return body.choices?.[0]?.message?.content ?? '';
  }

  async analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis> {
    const content: any[] = [
      { type: 'text', text: CONDITION_PROMPT(input.product.name, input.imageUrls.length) },
      ...input.imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
    ];
    const raw = await this.chat([{ role: 'user', content }]);
    return parseConditionJson(raw, this.name);
  }

  async complete(prompt: string): Promise<string> {
    return this.chat([{ role: 'user', content: prompt }]);
  }
}
