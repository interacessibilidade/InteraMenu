import { Link } from "react-router-dom";
import {
  Accessibility,
  QrCode,
  Bell,
  Languages,
  Volume2,
  ShieldCheck,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Accessibility,
    title: "Feito para acessibilidade de verdade",
    description:
      "Desenvolvido seguindo a WCAG 2.2 e a ABNT NBR 17225:2025 — não é um cardápio comum com um selo, é acessível desde a estrutura.",
  },
  {
    icon: Volume2,
    title: "Áudio e leitura de tela",
    description:
      "Cada prato pode ser ouvido em voz alta, com textos alternativos descritivos em cada imagem, pensado para quem usa leitor de tela.",
  },
  {
    icon: Languages,
    title: "Vários idiomas, sem trabalho manual",
    description:
      "O cardápio é traduzido automaticamente para inglês, espanhol e francês, sem seu restaurante precisar redigitar nada.",
  },
  {
    icon: QrCode,
    title: "QR Code por mesa",
    description:
      "Cada mesa tem seu próprio código, gerado e gerenciado por você, sem depender de ninguém pra atualizar.",
  },
  {
    icon: Bell,
    title: "Chamar garçom pelo celular",
    description:
      "O cliente chama o garçom direto do cardápio, com um painel de atendimento em tempo real pra sua equipe.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados, isolados e protegidos",
    description:
      "Cada restaurante enxerga só o próprio cardápio — sua conta nunca vê nem afeta a de outro cliente.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo principal
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <span className="text-xl font-extrabold text-foreground">InteraMenu</span>
          <nav aria-label="Principal" className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cadastre seu restaurante
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo-principal">
        <section className="container py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            O cardápio digital que qualquer cliente consegue usar
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            InteraMenu é o cardápio por QR Code pensado para acessibilidade: leitura por voz,
            tradução automática, texto alternativo em toda imagem e conformidade com a WCAG 2.2 e
            a ABNT NBR 17225:2025 — sem complicar a rotina do seu restaurante.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cadastre seu restaurante gratuitamente
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#recursos"
              className="rounded-md px-6 py-3 text-base font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver como funciona
            </a>
          </div>
        </section>

        <section id="recursos" className="border-t border-border bg-muted/30 py-16 sm:py-20">
          <div className="container">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Recursos pensados para todo mundo pedir sozinho
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <f.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-16 sm:py-20">
          <div className="container grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Simples pra quem administra</h2>
              <ul className="mt-6 space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>Cadastre seu restaurante e comece a usar no mesmo dia, sem instalar nada.</span>
                </li>
                <li className="flex gap-3">
                  <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>Gere e baixe os QR Codes de cada mesa em segundos.</span>
                </li>
                <li className="flex gap-3">
                  <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>Acompanhe chamados de garçom em tempo real, mesa por mesa.</span>
                </li>
              </ul>
              <Link
                to="/cadastro"
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Começar agora
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">
              <p className="text-sm">
                Já é cliente e quer ver um cardápio em funcionamento? Veja um exemplo real:
              </p>
              <Link
                to="/cafe-infinito-olhar"
                className="mt-3 inline-block font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cardápio do Café Infinito Olhar
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <p>InteraMenu, um produto Interacessibilidade Soluções em Acessibilidade.</p>
          <Link to="/login" className="underline-offset-4 hover:underline">
            Já sou cliente, quero entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
