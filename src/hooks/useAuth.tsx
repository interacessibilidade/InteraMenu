import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "restaurant_owner" | "staff";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
  restaurantLogoUrl: string | null;
  restaurantPrimaryColor: string | null;
  restaurantEnableOrdering: boolean;
  restaurantServiceFeePercent: number;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshRestaurantProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string | null>(null);
  const [restaurantPrimaryColor, setRestaurantPrimaryColor] = useState<string | null>(null);
  const [restaurantEnableOrdering, setRestaurantEnableOrdering] = useState(false);
  const [restaurantServiceFeePercent, setRestaurantServiceFeePercent] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega a sessão atual e escuta mudanças (login/logout em outras abas também)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // O carregamento do papel é feito à parte, para não travar o listener do Supabase
        setTimeout(() => loadRole(newSession.user.id), 0);
      } else {
        setRole(null);
        setRestaurantId(null);
        setRestaurantSlug(null);
        setRestaurantName(null);
        setRestaurantLogoUrl(null);
        setRestaurantPrimaryColor(null);
        setRestaurantEnableOrdering(false);
        setRestaurantServiceFeePercent(10);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      if (current?.user) {
        loadRole(current.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function applyRoleData(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, restaurant_id, restaurants(slug, name, logo_url, primary_color, enable_ordering, service_fee_percent)")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setRole(data.role as AppRole);
      setRestaurantId(data.restaurant_id);
      setRestaurantSlug((data as any).restaurants?.slug ?? null);
      setRestaurantName((data as any).restaurants?.name ?? null);
      setRestaurantLogoUrl((data as any).restaurants?.logo_url ?? null);
      setRestaurantPrimaryColor((data as any).restaurants?.primary_color ?? null);
      setRestaurantEnableOrdering(Boolean((data as any).restaurants?.enable_ordering));
      setRestaurantServiceFeePercent(
        (data as any).restaurants?.service_fee_percent != null
          ? Number((data as any).restaurants.service_fee_percent)
          : 10
      );
    } else {
      setRole(null);
      setRestaurantId(null);
      setRestaurantSlug(null);
      setRestaurantName(null);
      setRestaurantLogoUrl(null);
      setRestaurantPrimaryColor(null);
      setRestaurantEnableOrdering(false);
      setRestaurantServiceFeePercent(10);
    }
  }

  async function loadRole(userId: string) {
    setLoading(true);
    await applyRoleData(userId);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Recarrega apenas os dados do restaurante (nome, logo, cor) sem esperar
  // um novo login. Usado logo após salvar a Identidade Visual, para que a
  // mudança apareça imediatamente em todo o sistema (menu, gestão do
  // cardápio, etc.), em vez de só depois de sair e entrar de novo.
  async function refreshRestaurantProfile() {
    if (!session?.user) return;
    // Não usa loadRole/setLoading aqui de propósito: isso evitaria que a tela
    // toda mostrasse "Carregando..." de novo só porque a identidade visual
    // foi salva.
    await applyRoleData(session.user.id);
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    role,
    restaurantId,
    restaurantSlug,
    restaurantName,
    restaurantLogoUrl,
    restaurantPrimaryColor,
    restaurantEnableOrdering,
    restaurantServiceFeePercent,
    loading,
    isSuperAdmin: role === "super_admin",
    signOut,
    refreshRestaurantProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return ctx;
}
