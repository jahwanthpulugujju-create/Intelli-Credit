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

    // Gather data
    const [companyRes, signalsRes, risksRes, researchRes] = await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("financial_signals").select("*").eq("company_id", companyId),
      supabase.from("risk_signals").select("*").eq("company_id", companyId),
      supabase.from("secondary_research").select("*").eq("company_id", companyId),
    ]);

    const company = companyRes.data;
    const signals = signalsRes.data || [];
    const risks = risksRes.data || [];
    const research = researchRes.data || [];

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

    const prompt = `Score this company using the Five Cs credit framework.

Company: ${company.company_name}
Sector: ${company.sector}
Annual Turnover: ₹${company.annual_turnover || 0}
Revenue: ₹${company.revenue || 0}
EBITDA: ₹${company.ebitda || 0}
Total Assets: ₹${company.total_assets || 0}
Debt Levels: ₹${company.debt_levels || 0}
Loan Requested: ₹${company.loan_amount || 0} (${company.loan_type || "N/A"})

Financial Signals: ${JSON.stringify(signals.map(s => ({ name: s.signal_name, value: s.signal_value, unit: s.unit })))}

Risk Signals (${risks.length}): ${risks.map(r => `${r.severity} - ${r.category}: ${r.description?.slice(0, 100)}`).join("; ")}

Research Findings: ${research.length} findings analyzed.
High severity: ${research.filter(r => r.severity === "high").length}
Medium severity: ${research.filter(r => r.severity === "medium").length}

Score each component:
- Character (0-25): Management quality, repayment history, business reputation
- Capacity (0-25): Ability to repay from cash flows, debt service coverage
- Capital (0-20): Owner's equity, retained earnings, financial cushion
- Collateral (0-15): Assets available as security
- Conditions (0-15): Market/industry conditions, loan purpose alignment`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a credit scoring AI for Indian enterprises." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_credit_score",
            description: "Submit Five Cs credit score",
            parameters: {
              type: "object",
              properties: {
                character_score: { type: "number", minimum: 0, maximum: 25 },
                capacity_score: { type: "number", minimum: 0, maximum: 25 },
                capital_score: { type: "number", minimum: 0, maximum: 20 },
                collateral_score: { type: "number", minimum: 0, maximum: 15 },
                conditions_score: { type: "number", minimum: 0, maximum: 15 },
                reasoning: {
                  type: "object",
                  properties: {
                    character: { type: "string" },
                    capacity: { type: "string" },
                    capital: { type: "string" },
                    collateral: { type: "string" },
                    conditions: { type: "string" },
                    overall: { type: "string" },
                  },
                  required: ["character", "capacity", "capital", "collateral", "conditions", "overall"],
                  additionalProperties: false,
                },
              },
              required: ["character_score", "capacity_score", "capital_score", "collateral_score", "conditions_score", "reasoning"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_credit_score" } },
        temperature: 0.3,
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
      return new Response(JSON.stringify({ error: "AI scoring failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No scoring result" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scores = JSON.parse(toolCall.function.arguments);
    const totalScore = scores.character_score + scores.capacity_score + scores.capital_score + scores.collateral_score + scores.conditions_score;

    let creditGrade = "D";
    if (totalScore >= 85) creditGrade = "A";
    else if (totalScore >= 70) creditGrade = "B";
    else if (totalScore >= 55) creditGrade = "C";

    let recommendation = "Reject";
    if (totalScore >= 85) recommendation = "Approve";
    else if (totalScore >= 65) recommendation = "Conditional Approval";

    // Delete old scores for this company
    await supabase.from("credit_scores").delete().eq("company_id", companyId);

    const { error } = await supabase.from("credit_scores").insert({
      company_id: companyId,
      character_score: scores.character_score,
      capacity_score: scores.capacity_score,
      capital_score: scores.capital_score,
      collateral_score: scores.collateral_score,
      conditions_score: scores.conditions_score,
      total_score: totalScore,
      credit_grade: creditGrade,
      reasoning: { ...scores.reasoning, recommendation },
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      total_score: totalScore,
      credit_grade: creditGrade,
      recommendation,
      scores,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
