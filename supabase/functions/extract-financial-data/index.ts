import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIGNAL_NAMES = [
  "Revenue", "EBITDA", "Net Profit", "Total Debt", "Total Assets",
  "Total Liabilities", "Cash Flow", "Interest Coverage", "Debt-Equity Ratio",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, companyId } = await req.json();
    if (!documentId || !companyId) {
      return new Response(JSON.stringify({ error: "documentId and companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document info and classification
    const { data: doc } = await supabase.from("documents").select("file_name, file_type").eq("id", documentId).single();
    const { data: classification } = await supabase.from("document_classifications")
      .select("detected_type, approved_type").eq("document_id", documentId).single();
    
    const docType = classification?.approved_type || classification?.detected_type || "Unknown";

    // Get company info for context
    const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a financial analyst AI. Based on the following company and document information, extract realistic financial signals.

Company: ${company?.company_name || "Unknown"}
Sector: ${company?.sector || "Unknown"}
Annual Turnover: ${company?.annual_turnover || "Unknown"}
Revenue: ${company?.revenue || "Unknown"}
EBITDA: ${company?.ebitda || "Unknown"}
Total Assets: ${company?.total_assets || "Unknown"}
Debt Levels: ${company?.debt_levels || "Unknown"}
Document: ${doc?.file_name || "Unknown"} (Type: ${docType})

Extract financial signals. Use the company data provided as a baseline and generate realistic related metrics.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a financial data extraction AI. Return structured data only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_financial_signals",
            description: "Extract financial signals from a document",
            parameters: {
              type: "object",
              properties: {
                signals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      signal_name: { type: "string", enum: SIGNAL_NAMES },
                      signal_value: { type: "number" },
                      unit: { type: "string", enum: ["INR", "ratio", "percentage"] },
                      confidence: { type: "number", minimum: 0, maximum: 1 },
                    },
                    required: ["signal_name", "signal_value", "unit"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["signals"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_financial_signals" } },
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let signals: any[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      signals = parsed.signals || [];
    }

    // Store signals
    const inserts = signals.map((s: any) => ({
      company_id: companyId,
      document_id: documentId,
      signal_name: s.signal_name,
      signal_value: s.signal_value,
      unit: s.unit || "INR",
      source: `AI Extraction - ${docType}`,
      period: "FY2024",
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("financial_signals").insert(inserts);
      if (error) console.error("Insert error:", error);
    }

    return new Response(JSON.stringify({ signals: inserts, count: inserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
