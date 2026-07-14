import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#precos", label: "Preços" },
  { href: "#faq", label: "FAQ" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            O Kelley Blue Book de qualquer item usado. Preço justo, agora, com dados reais de
            mercado e IA.
          </p>
        </div>
        {[
          {
            title: "Produto",
            links: ["Como funciona", "Preços", "API pública", "Widget embeddable"],
          },
          {
            title: "Empresa",
            links: ["Sobre", "Blog", "Carreiras", "Contato"],
          },
          {
            title: "Legal",
            links: ["Termos de uso", "Privacidade", "Segurança"],
          },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container flex flex-col items-center justify-between gap-4 border-t py-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} PriceAI. Todos os direitos reservados.</p>
        <p>Feito com dados reais de Mercado Livre, OLX, eBay, Amazon e mais.</p>
      </div>
    </footer>
  );
}
