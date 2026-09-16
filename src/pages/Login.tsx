import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-extrabold text-foreground">Entrar</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>

          <div className="mb-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                aria-invalid={!!error}
                className="pr-12"
              />
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

          <div aria-live="polite" className="mb-4 min-h-[1.25rem] text-sm text-destructive">
            {error}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-medium text-primary underline-offset-4 hover:underline">
            Cadastre seu restaurante
          </Link>
        </p>
      </div>
    </main>
  );
}
