import {
  BadgeCheck,
  Camera,
  Check,
  ChartLine,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/motion";
import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    title: "Descreva o produto",
    description:
      "Escolha categoria, marca, modelo e ano. Informe condição, acessórios, nota fiscal e garantia.",
    icon: Sparkles,
  },
  {
    title: "Envie as fotos",
    description:
      "Até 15 fotos. Nossa IA de visão computacional detecta riscos, desgaste e defeitos automaticamente.",
    icon: Camera,
  },
  {
    title: "Receba o preço justo",
    description:
      "Preço recomendado, venda rápida e preço máximo — com o cálculo completo, passo a passo, auditável.",
    icon: ChartLine,
  },
];

const features = [
  {
    icon: Radar,
    title: "Dados reais de mercado",
    description:
      "Coleta em Mercado Livre, OLX, Facebook Marketplace, eBay, Amazon e Magazine Luiza, com filtragem agressiva de ruído.",
  },
  {
    icon: Camera,
    title: "Visão computacional",
    description:
      "Análise de até 15 fotos detecta riscos, tela trincada, oxidação e desgaste — gerando nota de condição explicada.",
  },
  {
    icon: ChartLine,
    title: "Engine transparente",
    description:
      "Pipeline auditável: base → idade → condição → demanda → região → histórico. Cada ajuste com valor e motivo.",
  },
  {
    icon: TrendingUp,
    title: "Monitoramento contínuo",
    description:
      "Acompanhe produtos e receba alertas de queda, alta, oportunidades e grandes descontos em tempo real.",
  },
  {
    icon: ShieldCheck,
    title: "Anti-fraude",
    description:
      "Anúncios muito abaixo do range viram alerta de proteção — evite golpes ao comprar ou vender.",
  },
  {
    icon: BadgeCheck,
    title: "Certificado de avaliação",
    description:
      "Gere um PDF assinado com o laudo completo — aumente a confiança do comprador na hora da venda.",
  },
];

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para quem quer testar o produto.",
    features: ["3 avaliações por mês", "1 monitor de preço", "Até 5 fotos por avaliação"],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para quem vende e compra com frequência.",
    features: [
      "50 avaliações por mês",
      "10 monitores de preço",
      "Até 15 fotos por avaliação",
      "Breakdown completo da engine",
      "Alertas em tempo real",
    ],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para lojas e revendedores de usados.",
    features: [
      "500 avaliações por mês",
      "100 monitores de preço",
      "API de precificação",
      "Certificado de avaliação em PDF",
      "Suporte prioritário",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Como o PriceAI calcula o preço justo?",
    a: "Combinamos anúncios reais coletados em múltiplos marketplaces com uma engine de ajustes por idade, condição (avaliada por IA a partir das fotos), demanda, região e histórico de 90 dias. Cada etapa é registrada e exibida no resultado.",
  },
  {
    q: "Preciso enviar fotos para toda avaliação?",
    a: "Sim — as fotos alimentam a nota de condição, que é um dos fatores mais importantes do preço final. Quanto mais fotos nítidas, maior a confiança do resultado.",
  },
  {
    q: "Quais marketplaces vocês pesquisam?",
    a: "Mercado Livre, OLX, Facebook Marketplace, eBay, Amazon e Magazine Luiza, com filtragem de lotes, réplicas, itens para peças e preços fora da faixa estatística.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem fidelidade. Seu plano permanece ativo até o fim do período já pago.",
  },
];

const marketplaces = [
  "Mercado Livre",
  "OLX",
  "Facebook Marketplace",
  "eBay",
  "Amazon",
  "Magazine Luiza",
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center">
          <div className="h-[480px] w-[780px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container grid gap-14 py-20 lg:grid-cols-2 lg:py-28">
          <FadeIn className="flex flex-col justify-center">
            <Badge variant="info" className="w-fit">
              <Sparkles className="h-3 w-3" />
              Novo: engine de preço com breakdown auditável
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Descubra o valor justo de{" "}
              <span className="text-primary">qualquer produto usado</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              O PriceAI combina dados reais de mercado, visão computacional e uma engine de preço
              transparente para dizer, em segundos, quanto vale o seu item — agora.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Avaliar meu produto grátis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Sem cartão de crédito · 3 avaliações grátis por mês
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="flex items-center justify-center">
            <Card className="w-full max-w-md p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">iPhone 15 Pro · 256 GB</p>
                  <p className="text-xs text-muted-foreground">Excelente estado · São Paulo, SP</p>
                </div>
                <Badge variant="success">92% de confiança</Badge>
              </div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Preço recomendado
                </p>
                <PriceDisplay value={6540} size="xl" className="mt-1" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Venda rápida</p>
                  <PriceDisplay value={5750} size="md" className="mt-1" />
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Preço máximo</p>
                  <PriceDisplay value={7130} size="md" className="mt-1" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
                <span className="text-muted-foreground">Nota de condição</span>
                <span className="money font-semibold text-emerald-600 dark:text-emerald-400">
                  9.2/10
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="text-muted-foreground">Tempo estimado de venda</span>
                <span className="font-medium">~7 dias</span>
              </div>
            </Card>
          </FadeIn>
        </div>

        <div className="border-y bg-muted/30 py-8">
          <div className="container">
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
              Preços calculados a partir de dados reais de
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {marketplaces.map((m) => (
                <span key={m} className="text-sm font-medium text-muted-foreground/80">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="container py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">
            Três passos entre "quanto vale isso?" e uma resposta com dados de verdade.
          </p>
        </FadeIn>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.08}>
              <Card className="h-full p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-medium text-primary">Passo {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="border-t bg-muted/20 py-24">
        <div className="container">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Tudo que você precisa para precificar</h2>
            <p className="mt-3 text-muted-foreground">
              Da coleta de dados ao monitoramento contínuo — uma plataforma completa.
            </p>
          </FadeIn>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05}>
                <Card className="h-full p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="container py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Preços simples e diretos</h2>
          <p className="mt-3 text-muted-foreground">Comece grátis. Faça upgrade quando precisar.</p>
        </FadeIn>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.06}>
              <Card
                className={
                  plan.highlighted
                    ? "relative h-full border-primary p-6 shadow-card ring-1 ring-primary"
                    : "h-full p-6"
                }
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-6">Mais popular</Badge>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="money text-3xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-7 w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-muted/20 py-24">
        <div className="container max-w-3xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Perguntas frequentes</h2>
          </FadeIn>
          <div className="mt-12 space-y-4">
            {faqs.map((f, i) => (
              <FadeIn key={f.q} delay={i * 0.05}>
                <Card className="p-5">
                  <p className="font-medium">{f.q}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container py-24">
        <FadeIn>
          <Card className="flex flex-col items-center gap-5 bg-primary px-8 py-14 text-center text-primary-foreground">
            <h2 className="text-3xl font-semibold tracking-tight">
              Pronto para saber o preço justo?
            </h2>
            <p className="max-w-md text-primary-foreground/80">
              Leva menos de 2 minutos para avaliar seu primeiro produto.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
          </Card>
        </FadeIn>
      </section>
    </>
  );
}
