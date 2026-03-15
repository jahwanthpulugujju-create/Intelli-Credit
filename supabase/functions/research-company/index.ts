import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single();
    if (!company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Analyze the following company for credit underwriting secondary research.

Company: ${company.company_name}
Sector: ${company.sector}
Subsector: ${company.subsector || "N/A"}
Headquarters: ${company.headquarters || "N/A"}
Annual Turnover: ₹${company.annual_turnover || 0}
Loan Type Requested: ${company.loan_type || "N/A"}
Loan Amount: ₹${company.loan_amount || 0}

Generate realistic secondary research findings covering: sector analysis, legal risks, regulatory environment, market outlook, and operational risks. Be specific and realistic for an Indian company in the ${company.sector} sector.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a credit research analyst AI." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_research",
            description: "Submit structured secondary research findings",
            parameters: {
              type: "object",
              properties: {
                findings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      research_type: { type: "string", enum: ["Sector Analysis", "Legal Risk", "Regulatory", "Market Outlook", "Operational Risk", "Litigation", "News"] },
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                      content: { type: "string" },
                      source: { type: "string" },
                    },
                    required: ["research_type", "severity", "content", "source"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["findings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_research" } },
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI research failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let findings: any[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      findings = parsed.findings || [];
    }

    // Store research findings
    const inserts = findings.map((f: any) => ({
      company_id: companyId,
      research_type: f.research_type,
      severity: f.severity,
      content: f.content,
      source: f.source,
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("secondary_research").insert(inserts);
      if (error) console.error("Insert error:", error);
    }

    // Also generate risk signals from findings
    const riskInserts = findings
      .filter((f: any) => f.severity === "medium" || f.severity === "high")
      .map((f: any) => ({
        company_id: companyId,
        risk_type: f.research_type,
        severity: f.severity,
        category: mapCategory(f.research_type),
        description: f.content,
        source: `Secondary Research - ${f.source}`,
      }));

    if (riskInserts.length > 0) {
      const { error } = await supabase.from("risk_signals").insert(riskInserts);
      if (error) console.error("Risk insert error:", error);
    }

    return new Response(JSON.stringify({ findings: inserts.length, risks: riskInserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapCategory(researchType: string): string {
  const map: Record<string, string> = {
    "Legal Risk": "Legal Risk",
    "Litigation": "Legal Risk",
    "Regulatory": "Regulatory Risk",
    "Market Outlook": "Market Risk",
    "Operational Risk": "Operational Risk",
    "Sector Analysis": "Market Risk",
    "News": "Operational Risk",
  };
  return map[researchType] || "Operational Risk";
}
