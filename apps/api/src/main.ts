import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PriceAI API')
    .setDescription('Precificação inteligente de produtos usados — REST /api/v1')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e sessão')
    .addTag('catalog', 'Categorias, marcas e modelos')
    .addTag('evaluations', 'Avaliações de produtos')
    .addTag('dashboard', 'Estatísticas do usuário')
    .addTag('monitors', 'Monitoramento de preços')
    .addTag('alerts', 'Alertas de preço')
    .addTag('notifications', 'Notificações')
    .addTag('subscriptions', 'Planos e assinaturas')
    .addTag('admin', 'Administração da plataforma')
    .addTag('health', 'Health check')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`PriceAI API rodando em http://localhost:${port}/api/v1 (docs em /docs)`);
}

void bootstrap();
