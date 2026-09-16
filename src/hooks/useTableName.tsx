import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTableNames(restaurantId?: string | null) {
  return useQuery({
    queryKey: ["tables", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId as string);
      if (error) throw error;
      const map: Record<number, string> = {};
      (data || []).forEach((t: any) => {
        if (t.display_name) map[t.table_number] = t.display_name;
      });
      return map;
    },
  });
}

export function useTableName(tableNumber: number | null | undefined, restaurantId?: string | null) {
  const { data } = useTableNames(restaurantId);
  if (!tableNumber) return null;
  return data?.[tableNumber] || null;
}
