import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const langNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
};

const supportedLangs = ["en", "es", "fr"] as const;
type Lang = typeof supportedLangs[number];

function fieldsFor(lang: Lang) {
  return {
    name: `name_${lang}`,
    description: `description_${lang}`,
    ingredients: `ingredients_${lang}`,
    audio_text: `audio_text_${lang}`,
  };
}

async function translateBatch(batch: any[], targetLang: Lang) {
  const prompt = `Translate these restaurant menu items from Portuguese to ${langNames[targetLang]}. Return ONLY a valid JSON object where each key is the item id and each value has: name, description, ingredients, audio_text. Keep it natural for a restaurant menu. The audio_text should sound natural when read aloud in ${langNames[targetLang]} and include the price phrasing in that language.

Items:
${JSON.stringify(batch)}`;

  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a professional restaurant menu translator. Return only valid JSON, no markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("AI gateway error", resp.status, errBody);
    const err: any = new Error(`AI API error: ${resp.status}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  let content = data.choices?.[0]?.message?.content ?? "{}";
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse batch translation:", e, content.slice(0, 200));
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, targetLang } = await req.json();

    if (!items || !targetLang || targetLang === "pt" || !supportedLangs.includes(targetLang)) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = targetLang as Lang;
    const f = fieldsFor(lang);
    const ids: string[] = items.map((i: any) => i.id).filter(Boolean);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Fetch latest cached state from DB to decide what needs translation
    const { data: rows, error: fetchErr } = await supabase
      .from("menu_items")
      .select(`id, name, description, ingredients, audio_text, needs_translation, is_translating, ${f.name}, ${f.description}, ${f.ingredients}, ${f.audio_text}`)
      .in("id", ids);

    if (fetchErr) {
      console.error("DB fetch error:", fetchErr);
      throw fetchErr;
    }

    const translations: Record<string, any> = {};
    const toTranslate: any[] = [];

    for (const row of rows || []) {
      const cached = (row as any)[f.name];
      // Use cached value if present for this language
      if (cached) {
        translations[row.id] = {
          name: (row as any)[f.name] || row.name,
          description: (row as any)[f.description] || row.description || "",
          ingredients: (row as any)[f.ingredients] || row.ingredients || "",
          audio_text: (row as any)[f.audio_text] || row.audio_text || "",
        };
      } else {
        toTranslate.push(row);
      }
    }

    if (toTranslate.length === 0) {
      return new Response(JSON.stringify({ translations, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Concurrency lock: only translate rows where is_translating = false
    const lockableIds = toTranslate.map((r: any) => r.id);
    const { data: locked, error: lockErr } = await supabase
      .from("menu_items")
      .update({ is_translating: true })
      .in("id", lockableIds)
      .eq("is_translating", false)
      .select("id, name, description, ingredients, audio_text");

    if (lockErr) console.error("Lock error:", lockErr);

    const lockedIds = new Set((locked || []).map((r: any) => r.id));
    const itemsToTranslate = (locked || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      ingredients: r.ingredients || "",
      audio_text: r.audio_text || "",
    }));

    // Anything not locked by us is being translated by another request — skip silently.
    if (itemsToTranslate.length === 0) {
      return new Response(JSON.stringify({ translations, locked: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BATCH_SIZE = 12;
    const batches: any[][] = [];
    for (let i = 0; i < itemsToTranslate.length; i += BATCH_SIZE) {
      batches.push(itemsToTranslate.slice(i, i + BATCH_SIZE));
    }

    const newTranslations: Record<string, any> = {};
    try {
      for (const batch of batches) {
        const parsed = await translateBatch(batch, lang);
        Object.assign(newTranslations, parsed);
      }
    } catch (e: any) {
      // Release locks before returning
      await supabase
        .from("menu_items")
        .update({ is_translating: false })
        .in("id", Array.from(lockedIds));

      if (e?.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add credits to your Lovable AI workspace.",
            code: "ai_credits_exhausted",
            translations,
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (e?.status === 429) {
        return new Response(
          JSON.stringify({
            error: "AI gateway rate limit reached. Please retry shortly.",
            code: "rate_limited",
            translations,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

    // Persist translations and release locks. Mark needs_translation=false only when
    // all 3 supported languages have a cached value (so other langs can still trigger).
    for (const id of lockedIds) {
      const tr = newTranslations[id];
      const update: Record<string, any> = { is_translating: false };
      if (tr) {
        update[f.name] = tr.name || null;
        update[f.description] = tr.description || null;
        update[f.ingredients] = tr.ingredients || null;
        update[f.audio_text] = tr.audio_text || null;
        update.translated_at = new Date().toISOString();
        translations[id] = tr;
      }
      const { error: updErr } = await supabase
        .from("menu_items")
        .update(update)
        .eq("id", id);
      if (updErr) console.error("Persist translation error", id, updErr);
    }

    // Refresh needs_translation flag: false when all langs cached
    const { data: refreshed } = await supabase
      .from("menu_items")
      .select("id, name_en, name_es, name_fr")
      .in("id", Array.from(lockedIds));
    for (const r of refreshed || []) {
      const allCached = (r as any).name_en && (r as any).name_es && (r as any).name_fr;
      if (allCached) {
        await supabase.from("menu_items").update({ needs_translation: false }).eq("id", (r as any).id);
      }
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message, translations: {} }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
