import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider,
  AnalyzeImagesInput,
  ConditionAnalysis,
} from './providers/ai-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { LocalProvider } from './providers/local.provider';
import { MockAiProvider } from './providers/mock.provider';
import { OpenAiProvider } from './providers/openai.provider';

/**
 * Factory + fallback em cascata: AI_PROVIDER="anthropic,openai" tenta
 * na ordem; qualquer falha cai para o próximo; o mock fecha a cascata
 * — o produto é sempre demonstrável, com ou sem chaves de API.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly registry: Record<string, AiProvider>;

  constructor(
    private readonly config: ConfigService,
    openai: OpenAiProvider,
    anthropic: AnthropicProvider,
    gemini: GeminiProvider,
    local: LocalProvider,
    private readonly mock: MockAiProvider,
  ) {
    this.registry = {
      openai,
      anthropic,
      gemini,
      local,
      mock,
    };
  }

  /** Cadeia efetiva de providers (configurados) terminando no mock. */
  getChain(): AiProvider[] {
    const wanted = (this.config.get<string>('ai.provider') ?? 'mock')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const chain: AiProvider[] = [];
    for (const name of wanted) {
      const provider = this.registry[name];
      if (provider && provider.isConfigured() && !chain.includes(provider)) chain.push(provider);
    }
    if (!chain.includes(this.mock)) chain.push(this.mock);
    return chain;
  }

  providersStatus(): Array<{ name: string; configured: boolean; active: boolean }> {
    const chain = this.getChain();
    return Object.values(this.registry).map((p) => ({
      name: p.name,
      configured: p.isConfigured(),
      active: chain.includes(p),
    }));
  }

  async analyzeImages(input: AnalyzeImagesInput): Promise<ConditionAnalysis> {
    for (const provider of this.getChain()) {
      try {
        return await provider.analyzeImages(input);
      } catch (err) {
        this.logger.warn(
          `Provider "${provider.name}" falhou em analyzeImages (${(err as Error).message}) — tentando próximo.`,
        );
      }
    }
    return this.mock.analyzeImages(input); // inalcançável, mas garante retorno
  }

  async complete(prompt: string): Promise<string> {
    for (const provider of this.getChain()) {
      try {
        return await provider.complete(prompt);
      } catch (err) {
        this.logger.warn(
          `Provider "${provider.name}" falhou em complete (${(err as Error).message}) — tentando próximo.`,
        );
      }
    }
    return this.mock.complete(prompt);
  }
}
