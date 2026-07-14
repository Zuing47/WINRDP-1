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
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ai.anthropicKey'));
  }

  private async messages(content: any): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.get<string>('ai.anthropicKey') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.get<string>('ai.anthropicModel'),
        max_tokens: 1500,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as any;
    return body.content?.map((b: any) => b.text ?? '').join('') ?? '';
  }

  async analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis> {
    const content: any[] = [
      { type: 'text', text: CONDITION_PROMPT(input.product.name, input.imageUrls.length) },
      ...input.imageUrls.map((url) => ({ type: 'image', source: { type: 'url', url } })),
    ];
    const raw = await this.messages(content);
    return parseConditionJson(raw, this.name);
  }

  async complete(prompt: string): Promise<string> {
    return this.messages(prompt);
  }
}
