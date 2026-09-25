import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Login() {
  useDocumentTitle("Entrar — InteraMenu");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.message.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos. Verifique e tente novamente."
          : "Não foi possível entrar agora. Tente novamente em instantes."
      );
      return;
    }

    navigate("/admin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/logo-interacessibilidade.png" alt="Interacessibilidade" className="h-10 w-auto" />
        <div className="h-1 w-16 rounded-full" style={{ backgroundColor: "#AF005F" }} aria-hidden="true" />
      </div>

      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-extrabold" style={{ color: "#1A1F2C" }}>
          Entrar
        </h1>
        <p className="mb-6 text-center text-sm text-foreground/80">
          Acesse o painel de gestão do seu restaurante
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby="login-email-hint"
            />
            <span id="login-email-hint" className="sr-only">
              Digite seu e-mail cadastrado para entrar na gestão do seu cardápio
            </span>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Senha</Label>
              <Link
                to="/esqueci-senha"
                className="text-xs font-medium underline-offset-4 hover:underline"
                style={{ color: "#AF005F" }}
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha cadastrada"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby="login-password-hint"
                className="pr-12"
              />
              <span id="login-password-hint" className="sr-only">
                Digite sua senha cadastrada
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div role="alert" className="mb-4 min-h-[1.25rem] text-sm text-destructive">
            {error}
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: "#AF005F" }}
            disabled={submitting}
            aria-label="Clique para entrar na gestão do cardápio"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/80">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-medium underline-offset-4 hover:underline" style={{ color: "#AF005F" }}>
            Cadastre seu restaurante
          </Link>
        </p>
      </div>
    </main>
  );
}
