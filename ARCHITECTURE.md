# PriceAI — Arquitetura da Plataforma

> Plataforma SaaS de precificação inteligente de produtos usados — o "Kelley Blue Book" de qualquer item usado. Este documento define a arquitetura, o modelo de dados, as entidades, os fluxos de usuário e todas as decisões técnicas **antes** da implementação.

---

## 1. Visão Geral

O PriceAI responde a uma pergunta: **"quanto vale este item usado, de forma justa, agora?"**

Para isso combina quatro pilares:

1. **Dados de mercado reais** — coleta de anúncios em Mercado Livre, OLX, Facebook Marketplace, eBay, Amazon, Magazine Luiza e outros, com filtragem agressiva de ruído (lotes, réplicas, itens para peças, preços absurdos, duplicados).
2. **Visão computacional** — análise de até 15 fotos por avaliação para detectar riscos, arranhões, tela quebrada, oxidação, amassados, desgaste e limpeza, gerando uma nota de condição (ex.: `9.4/10`) e um relatório explicativo.
3. **Engine de preço modular** — pipeline determinístico e auditável de ajustes (`base → idade → condição → demanda → região → histórico → final`), onde cada passo registra o quanto alterou o preço e por quê.
4. **Monitoramento contínuo** — acompanhamento de produtos com alertas de queda/alta de preço, oportunidades e grandes descontos.

## 2. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/web (Next.js 14)                    │
│   App Router · TypeScript · Tailwind · shadcn/ui · Framer       │
│   Motion · TanStack Query · Dark Mode · Recharts                │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST /api/v1 (JWT Bearer)
┌───────────────────────────────▼─────────────────────────────────┐
│                        apps/api (NestJS 10)                     │
│                                                                 │
│  HTTP Layer      Controllers · DTOs · Validators · Guards ·     │
│                  Interceptors · Middlewares                     │
│  Domain Layer    Use Cases · Services · Pricing Engine ·        │
│                  Market Aggregator · AI Providers               │
│  Data Layer      Repositories (Prisma) · Cache (Redis)          │
│  Async Layer     BullMQ workers: market-search, photo-analysis, │
│                  price-monitor, notifications                   │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
   PostgreSQL       Redis        S3-compatible   Provedores IA
   (Prisma ORM)  (cache+filas)   (fotos)         (OpenAI/Claude/
                                                  Gemini/local)
```

### Por que essa arquitetura?

| Decisão | Justificativa |
|---|---|
| **Monorepo (`apps/web`, `apps/api`, `packages/shared`)** | Um único PR atravessa front e back; tipos compartilhados (`packages/shared`) eliminam drift de contrato entre API e UI. pnpm workspaces é rápido e disk-efficient. |
| **REST versionado (`/api/v1`)** | Mais simples de cachear, documentar (Swagger) e consumir por terceiros (API pública futura é um upsell natural do produto). |
| **BullMQ para todo trabalho pesado** | Busca de mercado (scraping/APIs), análise de fotos por IA e monitoramento são lentos e falham. Filas dão retry, backoff, rate-limit por marketplace e isolam a latência do request HTTP. O usuário recebe a avaliação por polling do status (`PENDING → ANALYZING → SEARCHING → PRICING → DONE`). |
| **Redis** | Cache de buscas de mercado (TTL 6h por chave `categoria:marca:modelo:variante`) — reduz custo de scraping em ordens de magnitude — e backend do BullMQ. |
| **Prisma** | Migrations versionadas, tipagem forte ponta a ponta, e o schema é a documentação viva do banco. |
| **Provedores de IA plugáveis** | Interface única `AiProvider` (`analyzeImages`, `complete`) com implementações OpenAI, Anthropic (Claude), Gemini e local (Ollama). Troca por variável de ambiente; fallback em cascata se um provedor falhar. |
| **Marketplaces plugáveis** | Interface `MarketplaceConnector` (`search(query): Listing[]`). Cada marketplace é um módulo isolado — hoje com dados simulados realistas, amanhã API oficial ou scraping — sem tocar no agregador. |
| **Engine de preço como pipeline de estágios** | Cada estágio é uma classe pura `PricingStage` (`apply(ctx): Adjustment`). Auditável (cada ajuste é persistido), testável isoladamente e extensível (novo estágio = nova classe registrada no pipeline). |
| **JWT access (15min) + refresh token rotativo (30d) + OAuth Google** | Padrão de mercado para SaaS; refresh rotativo com detecção de reuso mitiga roubo de token. |
| **S3 pré-assinado (presigned upload)** | O browser envia fotos direto ao storage; a API só emite URLs e registra metadados — sem gargalo de banda no backend. |

## 3. Modelo de Dados (PostgreSQL)

14 tabelas principais. Diagrama lógico:

```
users ──< refresh_tokens
users ──< evaluations >── models >── brands
users ──< monitors                      │
users ──< notifications          categories
users ──< subscriptions >── plans
evaluations ──< photos
evaluations ──< price_adjustments      (auditoria da engine)
evaluations ──1 condition_reports      (relatório da IA de visão)
evaluations ──< market_prices          (anúncios coletados)
models ──< price_history               (série temporal agregada)
monitors ──< alerts
```

### Tabelas

- **users** — id (uuid), name, email (unique), password_hash (nullable p/ OAuth), google_id, avatar_url, role (`USER|ADMIN`), status, timestamps.
- **categories** — slug, name, icon, atributos dinâmicos (JSON schema dos campos extras por categoria: capacidade p/ celular, quilometragem p/ veículo…), depreciação anual default.
- **brands** — name, slug, logo_url, category N:N via `brand_categories`.
- **models** — brand_id, category_id, name, slug, release_year, msrp (preço de lançamento), specs JSONB.
- **evaluations** — user_id, model_id, status (enum do pipeline), condition (`NEW…FOR_PARTS`), year, attributes JSONB (capacidade, cor…), has_invoice, has_warranty, accessories JSONB, location (city/state), condition_score decimal, prices (recommended/quick_sale/max/min/avg/median), confidence, estimated_days_to_sell, currency, timestamps.
- **photos** — evaluation_id, storage_key, url, order, analysis JSONB (defeitos detectados por foto), score parcial.
- **condition_reports** — evaluation_id (1:1), overall_score, summary (texto gerado pela IA), findings JSONB (`[{type: 'scratch', severity, location, confidence}]`), provider usado.
- **market_prices** — evaluation_id, marketplace (enum), title, price, url, seller_rating, condition_label, is_outlier, excluded_reason (nullable — por que o anúncio foi filtrado), collected_at.
- **price_history** — model_id, date, avg/median/min/max price, sample_size, condition_bucket. Alimenta gráficos de evolução e o estágio "histórico" da engine.
- **price_adjustments** — evaluation_id, stage (`BASE|AGE|CONDITION|DEMAND|REGION|HISTORY`), order, input_price, output_price, factor, reason (texto legível). É o "extrato" do cálculo.
- **monitors** — user_id, model_id, condition, target_price, notify_on (flags: rise/drop/opportunity/big_discount), active, last_checked_at.
- **alerts** — monitor_id, type (`PRICE_RISE|PRICE_DROP|OPPORTUNITY|BIG_DISCOUNT`), old_price, new_price, listing_url, read, created_at.
- **plans** — name, slug, price_cents, interval, limits JSONB (avaliações/mês, monitores, fotos por avaliação), features.
- **subscriptions** — user_id, plan_id, status (`ACTIVE|PAST_DUE|CANCELED|TRIALING`), period start/end, external_id (gateway).
- **notifications** — user_id, type, title, body, data JSONB, read_at.
- **refresh_tokens** — user_id, token_hash, expires_at, revoked_at, replaced_by (rotação com detecção de reuso).
- **api_usage_logs** — user_id, route, status, latency_ms, created_at (admin/estatísticas).

**Índices críticos:** `market_prices(evaluation_id)`, `price_history(model_id, date)`, `evaluations(user_id, created_at desc)`, `alerts(monitor_id, read)`, `models(brand_id)`, busca por `models.name` via `pg_trgm` (futuro).

## 4. Engine de Preço (detalhe)

```
PricingContext {
  basePrice        // mediana dos anúncios válidos coletados
  evaluation       // condição, ano, local, atributos
  marketStats      // min, max, avg, median, sampleSize, dispersion
  history          // price_history do modelo (90 dias)
  demandSignal     // razão anúncios recentes/antigos + velocidade de venda
}

Pipeline (ordem fixa, cada estágio retorna Adjustment):
1. BaseStage      → define preço base = mediana de mercado (robusta a outliers)
2. AgeStage       → depreciação composta por idade vs. curva da categoria
3. ConditionStage → multiplica pela curva de condição (score 0–10 → fator 0.45–1.08)
4. DemandStage    → ±8% conforme sinal de demanda (liquidez do modelo)
5. RegionStage    → ajuste por UF (tabela de fatores regionais, ex.: SP 1.00, capital vs interior)
6. HistoryStage   → suaviza contra a tendência de 90 dias (evita pico/queda momentânea)

Saída:
- recommendedPrice (preço justo)
- quickSalePrice   (−12%, venda em ~1 semana)
- maxPrice         (+9%, para vendedor paciente)
- confidence       (função de sampleSize, dispersão dos preços e score de fotos)
- estimatedDaysToSell (função de demanda + posição do preço no range)
```

Cada estágio persiste um registro em `price_adjustments` com `input`, `output`, `factor` e `reason` legível — a UI mostra o cálculo passo a passo, com total transparência.

**Confiança da IA:** `confidence = f(n amostras, coeficiente de variação dos preços, qualidade da análise de fotos)` — ex.: 40+ anúncios com baixa dispersão e 10 fotos nítidas → 92%+.

## 5. Busca de Mercado (detalhe)

```
MarketSearchService
 ├── connectors: MercadoLivre | OLX | FacebookMarketplace | eBay | Amazon | MagazineLuiza
 ├── fan-out paralelo com timeout individual por connector
 ├── ListingFilterChain (cada filtro exclui e registra o motivo):
 │     BrokenItemFilter      → "quebrado", "trincado", "não liga", "defeito"
 │     ForPartsFilter        → "para peças", "retirada de peças", "sucata"
 │     BundleFilter          → "lote", "kit com", "atacado", quantidade > 1
 │     ReplicaFilter         → "réplica", "primeira linha", "similar", "genérico"
 │     PriceSanityFilter     → fora de [média ± 2.5σ] ou < 20% / > 300% da mediana
 │     DuplicateFilter       → fingerprint(título normalizado + preço + vendedor)
 │     RelevanceFilter       → similaridade título × modelo buscado
 └── MarketStatsCalculator → min, max, avg, median, stddev, sampleSize
```

Resultados cacheados em Redis por 6h. Conectores atuais geram **dados simulados determinísticos e realistas** (seed por modelo) atrás da mesma interface que os conectores reais usarão — trocar mock por API/scraping não altera nenhuma outra camada.

## 6. Análise de Fotos por IA (detalhe)

1. Front pede até 15 presigned URLs → sobe as fotos direto ao S3.
2. `POST /evaluations/:id/analyze` enfileira job `photo-analysis`.
3. Worker chama `AiProvider.analyzeImages(urls, promptDeCondicao)` — prompt estruturado pede JSON com defeitos por foto: tipo (risco, arranhão, tela quebrada, oxidação, amassado, desgaste, sujeira), severidade (0–1), localização, confiança.
4. Agregador converte defeitos → `overall_score` (0–10, ex.: 9.4) e gera relatório textual explicando a nota.
5. Score alimenta o `ConditionStage` da engine.

Providers: `OpenAiProvider` (GPT-4o), `AnthropicProvider` (Claude), `GeminiProvider`, `LocalProvider` (Ollama/LLaVA) — todos atrás de `AiProvider`; seleção e fallback via env (`AI_PROVIDER=anthropic,openai`). Sem chave configurada, um `MockProvider` determinístico mantém o produto 100% demonstrável.

## 7. Fluxo Completo do Usuário

1. **Landing** → proposta de valor, planos, CTA.
2. **Cadastro/Login** — e-mail+senha ou Google OAuth → access token (memória) + refresh (cookie httpOnly).
3. **Dashboard** — cards: avaliações realizadas, produtos avaliados, economia gerada, produtos monitorados; gráfico de atividade; últimas avaliações; alertas recentes.
4. **Nova avaliação (wizard em 4 passos)**
   1. Categoria (grid com 10 categorias) → Marca → Modelo → Ano.
   2. Detalhes: capacidade/cor (atributos dinâmicos da categoria), estado, nota fiscal, garantia, acessórios, localização.
   3. Fotos: upload até 15 imagens com preview, análise IA com progresso.
   4. Processamento: status em tempo real (analisando fotos → buscando mercado → calculando preço).
5. **Resultado** — preço recomendado em destaque, venda rápida, preço máximo, confiança (92%), tempo estimado de venda, nota de condição com relatório, breakdown passo a passo da engine, anúncios usados como base (e os excluídos, com motivo), botão "monitorar este produto".
6. **Monitoramento** — lista de monitores, alertas (subiu/caiu/oportunidade/desconto), configuração por monitor.
7. **Histórico** — todas as avaliações, comparação entre avaliações do mesmo produto, gráfico de evolução de preço.
8. **Admin** (`role=ADMIN`) — usuários, assinaturas, logs, categorias/marcas/modelos (CRUD), estatísticas da plataforma, status de APIs/conectores, cache, configurações.

## 8. API (contrato resumido)

```
POST   /api/v1/auth/register | /login | /refresh | /logout | /google
GET    /api/v1/auth/me
GET    /api/v1/catalog/categories | /brands?categoryId | /models?brandId&search
GET    /api/v1/dashboard/stats | /dashboard/activity
POST   /api/v1/evaluations                      (cria rascunho)
POST   /api/v1/evaluations/:id/photos/presign   (URLs de upload)
POST   /api/v1/evaluations/:id/submit           (dispara pipeline async)
GET    /api/v1/evaluations/:id                  (status + resultado completo)
GET    /api/v1/evaluations                      (histórico paginado, filtros)
GET    /api/v1/evaluations/:id/breakdown        (price_adjustments)
GET    /api/v1/models/:id/price-history?days=90
POST   /api/v1/monitors        GET /monitors    PATCH/DELETE /monitors/:id
GET    /api/v1/alerts          PATCH /alerts/:id/read
GET    /api/v1/notifications   PATCH /notifications/:id/read
GET    /api/v1/plans           POST /subscriptions
ADMIN: /api/v1/admin/users | /admin/subscriptions | /admin/logs |
       /admin/stats | /admin/catalog/* | /admin/system (APIs, cache, config)
```

Padrões: respostas `{ data, meta }`, erros RFC7807-like `{ statusCode, message, error }`, paginação cursor/offset, rate-limit por usuário, Swagger em `/docs`.

## 9. Design System

- **Referências:** Linear, Stripe, Vercel, Notion, Raycast.
- **Base:** branco dominante (`#FFFFFF` / `zinc-50`), texto `zinc-900/zinc-500`, primária **`#2563EB`** usada com parcimônia (CTAs, links, estados ativos, acentos de gráfico).
- **Dark mode:** `zinc-950` de fundo, superfícies `zinc-900`, mesma primária.
- **Tipografia:** Inter (variable), títulos com tracking levemente negativo, tabular-nums em valores monetários.
- **Componentes:** shadcn/ui (Button, Card, Dialog, Input, Select, Tabs, Badge, Skeleton, Toast…), bordas `1px` sutis, sombras quase imperceptíveis, raio `8–12px`.
- **Micro-animações:** Framer Motion — fade/slide de 150–250ms em cards e páginas, número que "conta" nos KPIs, progresso do pipeline de avaliação. Nada exagerado.
- **Gráficos:** Recharts com grid sutil, tooltips minimalistas, área com gradiente da primária.
- **Responsivo:** sidebar colapsa em bottom-nav/mobile drawer; grids `1 → 2 → 4` colunas.

## 10. Escalabilidade (milhões de usuários)

- **Stateless API** → réplicas horizontais atrás de load balancer; JWT elimina sessão em memória.
- **Workers separados do HTTP** → escala independente do pipeline pesado (fotos/mercado).
- **Cache em camadas** → Redis para buscas de mercado (6h) e catálogo (24h); `price_history` pré-agregado por job noturno em vez de agregação on-read.
- **Postgres** → índices cobertos, JSONB para atributos dinâmicos (evita EAV), read-replicas quando necessário; `market_prices` é candidata a particionamento por mês.
- **S3 + CDN** para fotos; upload direto do browser.
- **Rate limiting** por plano (limites em `plans.limits`) — proteção e monetização.
- **Observabilidade** → logs estruturados (pino), `api_usage_logs`, health checks (`/health`), métricas de fila.

## 11. Melhorias que aumentam o valor do produto (roadmap)

1. **API pública B2B** — lojas de usados, seguradoras e fintechs pagam por precificação via API (o verdadeiro "KBB money").
2. **Widget embeddable** — "quanto vale?" para marketplaces e e-commerces parceiros.
3. **Certificado de avaliação (PDF assinado)** — comprador confia, vendedor paga.
4. **Índice PriceAI** — índice público mensal de preços de usados por categoria (SEO + autoridade de marca).
5. **Sugestão de anúncio** — IA gera título/descrição otimizados para vender na faixa recomendada.
6. **Melhor momento para vender** — sazonalidade por categoria (ex.: consoles antes do Natal, iPhones caem no lançamento do novo).
7. **Trade-in score para lojas** — margem estimada de recompra por item.
8. **Extensão de navegador** — mostra o preço justo em cima de qualquer anúncio aberto.
9. **Detecção de fraude** — anúncio muito abaixo do range = provável golpe; vira alerta de proteção ao usuário.

## 12. Estrutura de Pastas

```
priceai/
├── apps/
│   ├── api/                      # NestJS
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── common/           # guards, interceptors, filters, decorators, dto base
│   │       ├── config/
│   │       ├── infra/            # prisma, redis, s3, bullmq
│   │       └── modules/
│   │           ├── auth/         # controllers/ services/ use-cases/ dto/
│   │           ├── users/ catalog/ evaluations/ photos/
│   │           ├── market/       # connectors/ filters/ stats/
│   │           ├── pricing/      # engine/ stages/
│   │           ├── ai/           # providers/
│   │           ├── monitors/ alerts/ notifications/
│   │           ├── subscriptions/ dashboard/ admin/
│   │           └── health/
│   └── web/                      # Next.js App Router
│       └── src/
│           ├── app/(marketing)/  # landing
│           ├── app/(auth)/       # login, register
│           ├── app/(app)/        # dashboard, evaluations, monitors, history, settings
│           ├── app/(admin)/      # painel administrativo
│           ├── components/ui/    # shadcn
│           ├── components/…      # domínio (kpi-card, price-breakdown, photo-uploader…)
│           ├── lib/              # api client, query client, utils
│           └── hooks/
├── packages/shared/              # tipos e contratos compartilhados
├── docker-compose.yml            # postgres, redis, minio, api, web
└── README.md
```

---

*Documento vivo — evolui junto com o produto.*
