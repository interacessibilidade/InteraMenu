import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, targetLang } = await req.json();

    if (!items || !targetLang || targetLang === "pt") {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langNames: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
    };

    const textsToTranslate = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      ingredients: item.ingredients || "",
      audio_text: item.audio_text || "",
    }));

    // Batch items to keep prompts small and reliable for large menus
    const BATCH_SIZE = 12;
    const batches: any[][] = [];
    for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
      batches.push(textsToTranslate.slice(i, i + BATCH_SIZE));
    }

    const translations: Record<string, any> = {};

    for (const batch of batches) {
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
        if (resp.status === 402) {
          return new Response(
            JSON.stringify({
              error: "AI credits exhausted. Please add credits to your Lovable AI workspace.",
              code: "ai_credits_exhausted",
              translations,
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (resp.status === 429) {
          return new Response(
            JSON.stringify({
              error: "AI gateway rate limit reached. Please retry shortly.",
              code: "rate_limited",
              translations,
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI API error: ${resp.status}`);
      }

      const data = await resp.json();
      let content = data.choices?.[0]?.message?.content ?? "{}";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        const parsed = JSON.parse(content);
        Object.assign(translations, parsed);
      } catch (e) {
        console.error("Failed to parse batch translation:", e, content.slice(0, 200));
      }
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(JSON.stringify({ error: error.message, translations: {} }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
