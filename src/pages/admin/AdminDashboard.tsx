import { Link } from "react-router-dom";
import { UtensilsCrossed, Bell, QrCode, BarChart3 } from "lucide-react";

const navItems = [
  {
    title: "Cadastro de Item do Cardápio",
    description: "Cadastrar ou editar pratos do cardápio",
    to: "/admin/gestao",
    icon: UtensilsCrossed,
    ariaLabel: "Ir para cadastro e edição de itens do cardápio",
  },
  {
    title: "Painel de Atendimento",
    description: "Visualizar e atender pedidos das mesas",
    to: "/admin/painel",
    icon: Bell,
    ariaLabel: "Ir para o painel de atendimento do garçom",
  },
  {
    title: "QR Codes das Mesas",
    description: "Gerar e acessar os QR Codes",
    to: "/admin/qrcode",
    icon: QrCode,
    ariaLabel: "Ir para gerador de QR Codes das mesas",
  },
  {
    title: "Relatórios de Atendimento",
    description: "Acompanhar pedidos e tempo de atendimento",
    to: "/admin/relatorio",
    icon: BarChart3,
    ariaLabel: "Ir para relatórios de atendimento",
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-5 text-center">
          <h1 className="text-2xl font-extrabold text-foreground">Gestão do Cardápio</h1>
          <p className="text-sm text-muted-foreground mt-1">Painel administrativo do restaurante</p>
        </div>
      </header>

      <main className="container py-8 px-4" role="main">
        <div className="grid gap-5 sm:grid-cols-2 max-w-2xl mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.ariaLabel}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
