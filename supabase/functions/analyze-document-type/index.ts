import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DOCUMENT_TYPES = [
  "ALM Statement",
  "Shareholding Pattern",
  "Borrowing Profile",
  "Annual Report",
  "Portfolio Performance Data",
];

function classifyByFilename(fileName: string): { type: string; confidence: number } {
  const lower = fileName.toLowerCase();

  const patterns: { pattern: RegExp; type: string; confidence: number }[] = [
    { pattern: /alm|asset.?liab/i, type: "ALM Statement", confidence: 0.85 },
    { pattern: /sharehold|shareholding|share.?hold/i, type: "Shareholding Pattern", confidence: 0.85 },
    { pattern: /borrow|borrowing|loan.?profile/i, type: "Borrowing Profile", confidence: 0.85 },
    { pattern: /annual.?report|p.?l|profit.?loss|balance.?sheet|cash.?flow|financial.?statement/i, type: "Annual Report", confidence: 0.80 },
    { pattern: /portfolio|performance|portfolio.?cut/i, type: "Portfolio Performance Data", confidence: 0.80 },
  ];

  for (const { pattern, type, confidence } of patterns) {
    if (pattern.test(lower)) {
      return { type, confidence };
    }
  }

  return { type: "Unknown", confidence: 0.3 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileName, fileType } = await req.json();

    if (!documentId || !fileName) {
      return new Response(
        JSON.stringify({ error: "documentId and fileName required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: filename heuristics
    let result = classifyByFilename(fileName);

    // Step 2: AI enhancement if heuristics are uncertain
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (result.confidence < 0.8 && LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You classify financial documents. Given a filename and file type, respond with ONLY a JSON object: {"type": "<one of: ${DOCUMENT_TYPES.join(", ")}, Unknown>", "confidence": <0.0-1.0>}`,
              },
              {
                role: "user",
                content: `Filename: "${fileName}", File type: "${fileType || "unknown"}"`,
              },
            ],
            temperature: 0.1,
            max_tokens: 100,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[^}]+\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.type && DOCUMENT_TYPES.includes(parsed.type)) {
              result = { type: parsed.type, confidence: Math.min(parsed.confidence || 0.7, 0.95) };
            }
          }
        }
      } catch (aiErr) {
        console.error("AI classification failed, using heuristics:", aiErr);
      }
    }

    // Store classification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("document_classifications").insert({
      document_id: documentId,
      detected_type: result.type,
      confidence: result.confidence,
      status: "pending",
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        detected_type: result.type,
        confidence: result.confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
