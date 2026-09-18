import { Link } from "react-router-dom";
import { UtensilsCrossed, Bell, QrCode, BarChart3, LogOut, ShieldCheck, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  {
    title: "Identidade Visual",
    description: "Escolher a cor e o logo do seu cardápio",
    to: "/admin/identidade",
    icon: Palette,
    ariaLabel: "Ir para configuração de identidade visual",
  },
];

export default function AdminDashboard() {
  const { restaurantName, isSuperAdmin, signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex flex-col items-center gap-2 py-5 text-center">
          <div className="flex w-full items-center justify-between gap-2 px-2">
            {isSuperAdmin ? (
              <Link
                to="/superadmin"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Painel geral
              </Link>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Gestão do Cardápio</h1>
          <p className="text-sm font-medium text-primary" aria-label={`Você está conectada como ${restaurantName || user?.email}`}>
            {restaurantName ? restaurantName : isSuperAdmin ? "Administração geral" : user?.email}
          </p>
          <p className="text-sm text-muted-foreground">Painel administrativo do restaurante</p>
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
