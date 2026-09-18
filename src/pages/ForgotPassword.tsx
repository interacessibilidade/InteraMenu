import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Digite seu e-mail para continuar.");
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setSubmitting(false);

    // Por segurança, mostramos a mesma mensagem mesmo se o e-mail não existir,
    // para não revelar quais e-mails têm conta cadastrada.
    if (resetError) {
      console.error(resetError);
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-extrabold text-foreground">
          Esqueci minha senha
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Vamos te enviar um link por e-mail para você criar uma nova senha
        </p>

        {sent ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md border border-border bg-muted/30 p-4 text-center text-sm text-foreground"
          >
            Se esse e-mail estiver cadastrado, você vai receber um link para redefinir sua senha
            em instantes. Confira também a caixa de spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-required="true"
                aria-invalid={!!error}
              />
            </div>

            <div aria-live="polite" className="mb-4 min-h-[1.25rem] text-sm text-destructive">
              {error}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar link de redefinição"}
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
