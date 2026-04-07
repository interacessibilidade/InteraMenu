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

    const prompt = `Translate the following restaurant menu items from Portuguese to ${langNames[targetLang]}. Return a JSON object where keys are item IDs and values have: name, description, ingredients, audio_text. Keep it natural for a restaurant menu. Only return the JSON, no markdown.

Items:
${JSON.stringify(textsToTranslate, null, 2)}`;

    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a professional restaurant menu translator. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      throw new Error(`AI API error: ${resp.status}`);
    }

    const data = await resp.json();
    let content = data.choices[0].message.content;
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const translations = JSON.parse(content);

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
