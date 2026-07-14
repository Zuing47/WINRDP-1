import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { LocalProvider } from './providers/local.provider';
import { MockAiProvider } from './providers/mock.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  providers: [
    AiService,
    OpenAiProvider,
    AnthropicProvider,
    GeminiProvider,
    LocalProvider,
    MockAiProvider,
  ],
  exports: [AiService],
})
export class AiModule {}
