import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ForgotPassword() {
  useDocumentTitle("Esqueci minha senha — InteraMenu");
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/logo-interacessibilidade.png" alt="Interacessibilidade" className="h-10 w-auto" />
        <div className="h-1 w-16 rounded-full" style={{ backgroundColor: "#AF005F" }} aria-hidden="true" />
      </div>

      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-extrabold" style={{ color: "#1A1F2C" }}>
          Esqueci minha senha
        </h1>
        <p className="mb-6 text-center text-sm text-foreground/80">
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
                placeholder="Digite o e-mail para recuperar a senha"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby="forgot-email-hint"
              />
              <span id="forgot-email-hint" className="sr-only">
                Digite o e-mail cadastrado da sua conta para receber o link de redefinição de senha
              </span>
            </div>

            <div role="alert" className="mb-4 min-h-[1.25rem] text-sm text-destructive">
              {error}
            </div>

            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: "#AF005F" }}
              disabled={submitting}
              aria-label="Clique para enviar o link de redefinição de senha por e-mail"
            >
              {submitting ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-foreground/80">
          <Link to="/login" className="font-medium underline-offset-4 hover:underline" style={{ color: "#AF005F" }}>
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
