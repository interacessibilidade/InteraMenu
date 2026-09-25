import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isPasswordStrong(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [website, setWebsite] = useState(""); // campo isca contra robôs (honeypot)
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setRestaurantName(value);
    if (!slugEditedManually) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Honeypot: campo invisível para humanos (também para leitor de tela).
    // Se veio preenchido, é robô — encerra silenciosamente sem revelar o motivo real.
    if (website) {
      setError("Não foi possível concluir o cadastro. Tente novamente.");
      return;
    }

    if (!restaurantName || !slug || !email || !password) {
      setError("Preencha todos os campos para continuar.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("A senha precisa ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número.");
      return;
    }

    setSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setSubmitting(false);
      setError(
        signUpError.message.includes("already registered")
          ? "Já existe uma conta com esse e-mail. Tente entrar em vez de cadastrar."
          : "Não foi possível criar a conta agora. Tente novamente."
      );
      return;
    }

    const { error: rpcError } = await supabase.rpc("create_restaurant_and_owner", {
      _name: restaurantName,
      _slug: slug,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(
        rpcError.message.includes("duplicate")
          ? "Esse endereço de cardápio já está em uso. Escolha outro."
          : "Sua conta foi criada, mas houve um problema ao registrar o restaurante. Fale com o suporte."
      );
      return;
    }

    navigate("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-extrabold text-foreground">Cadastre seu restaurante</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Crie sua conta e comece a usar o InteraMenu agora mesmo
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Campo isca — invisível para todo mundo, inclusive leitor de tela */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="website">Não preencha este campo</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="signup-restaurant-name">Nome do restaurante</Label>
            <Input
              id="signup-restaurant-name"
              name="restaurantName"
              type="text"
              autoComplete="off"
              placeholder="Digite o nome do seu restaurante"
              value={restaurantName}
              onChange={(e) => handleNameChange(e.target.value)}
              aria-required="true"
              aria-describedby="signup-restaurant-name-hint"
            />
            <span id="signup-restaurant-name-hint" className="sr-only">
              Digite o nome do seu restaurante, como ele deve aparecer no cardápio
            </span>
          </div>

          <div className="mb-4">
            <Label htmlFor="signup-slug">Endereço do seu cardápio</Label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">interamenu.com.br/</span>
              <Input
                id="signup-slug"
                name="slug"
                type="text"
                autoComplete="off"
                placeholder="nome-do-restaurante"
                value={slug}
                onChange={(e) => {
                  setSlugEditedManually(true);
                  setSlug(slugify(e.target.value));
                }}
                aria-required="true"
                aria-describedby="signup-slug-hint"
                className="flex-1"
              />
            </div>
            <p id="signup-slug-hint" className="mt-1 text-xs text-muted-foreground">
              É o link que seus clientes vão acessar pelo QR Code da mesa. Preenchido automaticamente, mas você pode editar.
            </p>
          </div>

          <div className="mb-4">
            <Label htmlFor="signup-email">Seu e-mail</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-describedby="signup-email-hint"
            />
            <span id="signup-email-hint" className="sr-only">
              Digite o e-mail que você vai usar para entrar na gestão do seu cardápio
            </span>
          </div>

          <div className="mb-2">
            <Label htmlFor="signup-password">Crie uma senha</Label>
            <div className="relative">
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                aria-describedby="signup-password-hint"
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
            <p id="signup-password-hint" className="mt-1 text-xs text-muted-foreground">
              Mínimo de 8 caracteres, com letra maiúscula, minúscula e número.
            </p>
          </div>

          <div aria-live="polite" className="mb-4 min-h-[1.25rem] text-sm text-destructive">
            {error}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Criando conta..." : "Criar conta e começar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
