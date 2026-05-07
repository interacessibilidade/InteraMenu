import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTableNames() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tables").select("*");
      if (error) throw error;
      const map: Record<number, string> = {};
      (data || []).forEach((t: any) => {
        if (t.display_name) map[t.table_number] = t.display_name;
      });
      return map;
    },
  });
}

export function useTableName(tableNumber: number | null | undefined) {
  const { data } = useTableNames();
  if (!tableNumber) return null;
  return data?.[tableNumber] || null;
}
