import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isPasswordStrong(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // O Supabase cria a sessão de recuperação automaticamente a partir do
    // link do e-mail. Escutamos o evento para saber quando ela está pronta.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Caso a sessão já tenha sido processada antes deste componente montar.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordStrong(password)) {
      setError("A senha precisa ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas digitadas não são iguais.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError("Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.");
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/admin"), 2000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-extrabold text-foreground">
          Criar nova senha
        </h1>

        {!ready ? (
          <p className="text-center text-sm text-muted-foreground" role="status" aria-live="polite">
            Confirmando seu link de redefinição...
          </p>
        ) : success ? (
          <div role="status" aria-live="polite" className="text-center text-sm text-foreground">
            Senha atualizada! Levando você para o painel...
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-2">
              <Label htmlFor="reset-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-required="true"
                  aria-describedby="reset-password-hint"
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
              <p id="reset-password-hint" className="mt-1 text-xs text-muted-foreground">
                Mínimo de 8 caracteres, com letra maiúscula, minúscula e número.
              </p>
            </div>

            <div className="mb-2 mt-4">
              <Label htmlFor="reset-confirm-password">Confirme a nova senha</Label>
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-required="true"
              />
            </div>

            <div aria-live="polite" className="mb-4 mt-2 min-h-[1.25rem] text-sm text-destructive">
              {error}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
