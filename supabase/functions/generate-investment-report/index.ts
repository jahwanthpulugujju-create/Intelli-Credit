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
    const { companyId, generatedBy } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather all data
    const [companyRes, signalsRes, risksRes, researchRes, scoreRes, docsRes] = await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("financial_signals").select("*").eq("company_id", companyId),
      supabase.from("risk_signals").select("*").eq("company_id", companyId),
      supabase.from("secondary_research").select("*").eq("company_id", companyId),
      supabase.from("credit_scores").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1),
      supabase.from("documents").select("id, file_name").eq("company_id", companyId),
    ]);

    const company = companyRes.data;
    const signals = signalsRes.data || [];
    const risks = risksRes.data || [];
    const research = researchRes.data || [];
    const creditScore = scoreRes.data?.[0];
    const docs = docsRes.data || [];

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

    const reasoning = creditScore?.reasoning as Record<string, string> | null;

    const prompt = `Generate a comprehensive credit assessment / investment memo report for the following company.

COMPANY OVERVIEW:
Name: ${company.company_name}
Sector: ${company.sector} / ${company.subsector || "N/A"}
Headquarters: ${company.headquarters || "N/A"}
CIN: ${company.cin || "N/A"}
PAN: ${company.pan || "N/A"}

FINANCIALS:
Annual Turnover: ₹${company.annual_turnover || 0}
Revenue: ₹${company.revenue || 0}
EBITDA: ₹${company.ebitda || 0}
Total Assets: ₹${company.total_assets || 0}
Debt Levels: ₹${company.debt_levels || 0}

LOAN REQUEST:
Type: ${company.loan_type || "N/A"}
Amount: ₹${company.loan_amount || 0}
Tenure: ${company.loan_tenure || 0} months
Rate: ${company.interest_rate || 0}%
Purpose: ${company.purpose_of_loan || "N/A"}

FINANCIAL SIGNALS (${signals.length}):
${signals.map(s => `${s.signal_name}: ${s.signal_value} ${s.unit}`).join("\n")}

RISK SIGNALS (${risks.length}):
${risks.map(r => `[${r.severity?.toUpperCase()}] ${r.category} - ${r.description}`).join("\n")}

SECONDARY RESEARCH (${research.length}):
${research.map(r => `[${r.severity}] ${r.research_type}: ${r.content}`).join("\n")}

CREDIT SCORE:
Total: ${creditScore?.total_score || "N/A"}/100
Grade: ${creditScore?.credit_grade || "N/A"}
Recommendation: ${reasoning?.recommendation || "N/A"}

DOCUMENTS REVIEWED: ${docs.length} documents

Generate the report with sections for: Executive Summary, Company Overview, Financial Analysis, Risk Assessment, SWOT Analysis, Credit Score Analysis, and Final Recommendation.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a senior credit analyst generating investment assessment reports for credit committees. Write professionally and concisely." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_report",
            description: "Submit the structured investment report",
            parameters: {
              type: "object",
              properties: {
                executive_summary: { type: "string" },
                company_overview: { type: "string" },
                financial_analysis: { type: "string" },
                risk_assessment: { type: "string" },
                swot: {
                  type: "object",
                  properties: {
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    opportunities: { type: "array", items: { type: "string" } },
                    threats: { type: "array", items: { type: "string" } },
                  },
                  required: ["strengths", "weaknesses", "opportunities", "threats"],
                  additionalProperties: false,
                },
                credit_score_analysis: { type: "string" },
                recommendation: { type: "string", enum: ["Approve", "Conditional Approval", "Reject"] },
                recommendation_details: { type: "string" },
                conditions: { type: "array", items: { type: "string" } },
              },
              required: ["executive_summary", "company_overview", "financial_analysis", "risk_assessment", "swot", "credit_score_analysis", "recommendation", "recommendation_details"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_report" } },
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
      return new Response(JSON.stringify({ error: "Report generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No report generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report = JSON.parse(toolCall.function.arguments);

    // Store the report
    const { data: savedReport, error } = await supabase.from("reports").insert({
      company_id: companyId,
      report_type: "investment",
      content: report,
      recommendation: report.recommendation,
      generated_by: generatedBy || null,
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reportId: savedReport.id, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
