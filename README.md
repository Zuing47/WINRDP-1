# PriceAI

**Precificação inteligente de produtos usados** — o "Kelley Blue Book" de qualquer item usado. Descubra o valor justo de mercado de celulares, notebooks, consoles, câmeras, móveis e muito mais, com base em milhares de anúncios reais, análise de fotos por IA e uma engine de preço totalmente transparente.

> 📐 Arquitetura completa, modelo de dados e decisões técnicas: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Como funciona

1. **Descreva o produto** — categoria, marca, modelo, ano, estado, acessórios, localização.
2. **Envie até 15 fotos** — a IA detecta riscos, arranhões, tela quebrada, oxidação, amassados e desgaste, gerando uma nota de condição (ex.: `9.4/10`) com relatório explicativo.
3. **O mercado é varrido** — Mercado Livre, OLX, Facebook Marketplace, eBay, Amazon e Magazine Luiza, com filtragem de lotes, réplicas, itens para peças, preços absurdos e duplicados.
4. **A engine calcula** — `base → idade → condição → demanda → região → histórico → preço final`, com cada ajuste auditável na tela.
5. **Você recebe** — preço recomendado, preço para venda rápida, preço máximo, confiança da IA e tempo estimado de venda. E pode monitorar o produto para receber alertas.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Recharts |
| Backend | NestJS 10, PostgreSQL + Prisma, Redis, BullMQ, Swagger |
| IA | Providers plugáveis: OpenAI, Anthropic (Claude), Gemini, modelos locais — com mock determinístico para demo |
| Auth | JWT + refresh token rotativo + Google OAuth |
| Storage | S3-compatível (MinIO em dev), upload direto via presigned URLs |
| Infra | Docker Compose, pnpm workspaces |

## Rodando localmente

```bash
# 1. Infra (Postgres, Redis, MinIO)
docker compose up -d postgres redis minio

# 2. Dependências
pnpm install

# 3. Banco de dados
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm db:seed

# 4. Dev (api em :3001, web em :3000)
pnpm dev
```

**Modo demo sem backend:** o frontend roda 100% com dados simulados — `cd apps/web && NEXT_PUBLIC_USE_MOCKS=true pnpm dev`.

Contas seed: `admin@priceai.com.br` / `admin123` (admin) · `demo@priceai.com.br` / `demo123`.

Documentação da API (Swagger): `http://localhost:3001/docs`.

## Estrutura

```
apps/api        # NestJS — arquitetura limpa (controllers, use-cases, services, repositories, DTOs)
apps/web        # Next.js — marketing, app (dashboard, avaliações, monitoramento, histórico) e admin
packages/       # código compartilhado (futuro)
```
