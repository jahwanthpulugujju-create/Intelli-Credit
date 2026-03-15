import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FileText,
  Shield,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';

interface ReportData {
  id: string;
  report_type: string;
  recommendation: string | null;
  content: {
    executive_summary?: string;
    company_overview?: string;
    financial_analysis?: string;
    risk_assessment?: string;
    swot?: {
      strengths?: string[];
      weaknesses?: string[];
      opportunities?: string[];
      threats?: string[];
    };
    credit_score_analysis?: string;
    recommendation_details?: string;
    conditions?: string[];
  } | null;
  created_at: string;
}

interface Company {
  id: string;
  company_name: string;
  sector: string;
  subsector: string | null;
  headquarters: string | null;
}

interface CreditScore {
  total_score: number | null;
  credit_grade: string | null;
  character_score: number | null;
  capacity_score: number | null;
  capital_score: number | null;
  collateral_score: number | null;
  conditions_score: number | null;
  reasoning: any;
}

export default function CompanyReport() {
  const { companyId, reportId } = useParams<{ companyId: string; reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [score, setScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !reportId) return;
    Promise.all([
      supabase.from('reports').select('*').eq('id', reportId).single(),
      supabase.from('companies').select('id, company_name, sector, subsector, headquarters').eq('id', companyId).single(),
      supabase.from('credit_scores').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1),
    ]).then(([rRes, cRes, sRes]) => {
      setReport(rRes.data as any);
      setCompany(cRes.data);
      setScore(sRes.data?.[0] ?? null);
      setLoading(false);
    });
  }, [companyId, reportId]);

  // Clean up AI text that has spaces between every character
  const cleanText = (text: string | undefined | null): string | undefined => {
    if (!text) return undefined;
    // Detect pattern: single chars separated by spaces like "N e x a l o g i c"
    // If more than 40% of "words" are single characters, it's likely spaced-out text
    const words = text.split(' ');
    const singleCharWords = words.filter(w => w.length === 1 && /[a-zA-Z]/.test(w)).length;
    if (words.length > 10 && singleCharWords / words.length > 0.3) {
      // Reconstruct: join single-char sequences, keep normal words
      let result = '';
      let i = 0;
      while (i < words.length) {
        if (words[i].length === 1 && /[a-zA-Z¹₹]/.test(words[i])) {
          // Collect consecutive single chars
          let charSeq = '';
          while (i < words.length && words[i].length <= 2 && /^[a-zA-Z¹₹.,;:!?'"\-—()/%0-9]+$/.test(words[i])) {
            charSeq += words[i];
            i++;
          }
          result += (result && !result.endsWith(' ') ? ' ' : '') + charSeq;
        } else {
          result += (result ? ' ' : '') + words[i];
          i++;
        }
      }
      return result;
    }
    return text;
  };

  const handleDownload = async () => {
    if (!report || !company) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const content = report.content;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const usable = pageWidth - margin * 2;
    let y = 20;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Credit Assessment Report', margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${company.company_name} • ${company.sector} • ${new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin, y);
    y += 6;
    doc.text(`Recommendation: ${report.recommendation || 'N/A'}${score ? ` • Credit Score: ${score.total_score}/100 (${score.credit_grade})` : ''}`, margin, y);
    doc.setTextColor(0);
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const addSection = (title: string, body: string | undefined | null) => {
      const cleaned = cleanText(body);
      if (!cleaned) return;
      checkPage(30);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(cleaned, usable);
      for (const line of lines) {
        checkPage(6);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 6;
    };

    addSection('Executive Summary', content?.executive_summary);
    addSection('Company Overview', content?.company_overview);
    addSection('Financial Analysis', content?.financial_analysis);
    addSection('Risk Assessment', content?.risk_assessment);
    addSection('Credit Score Analysis', content?.credit_score_analysis);

    // Credit Score Table
    if (score) {
      checkPage(40);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Credit Score Breakdown', margin, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Component', 'Score', 'Max', 'Percentage']],
        body: [
          ['Character', String(score.character_score ?? 0), '25', `${Math.round(((score.character_score ?? 0) / 25) * 100)}%`],
          ['Capacity', String(score.capacity_score ?? 0), '25', `${Math.round(((score.capacity_score ?? 0) / 25) * 100)}%`],
          ['Capital', String(score.capital_score ?? 0), '20', `${Math.round(((score.capital_score ?? 0) / 20) * 100)}%`],
          ['Collateral', String(score.collateral_score ?? 0), '15', `${Math.round(((score.collateral_score ?? 0) / 15) * 100)}%`],
          ['Conditions', String(score.conditions_score ?? 0), '15', `${Math.round(((score.conditions_score ?? 0) / 15) * 100)}%`],
          ['Total', String(score.total_score ?? 0), '100', `${score.total_score ?? 0}%`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // SWOT
    if (content?.swot) {
      checkPage(30);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('SWOT Analysis', margin, y);
      y += 4;
      const swotData: string[][] = [];
      const maxLen = Math.max(
        content.swot.strengths?.length ?? 0, content.swot.weaknesses?.length ?? 0,
        content.swot.opportunities?.length ?? 0, content.swot.threats?.length ?? 0
      );
      for (let i = 0; i < maxLen; i++) {
        swotData.push([
          content.swot.strengths?.[i] ?? '',
          content.swot.weaknesses?.[i] ?? '',
          content.swot.opportunities?.[i] ?? '',
          content.swot.threats?.[i] ?? '',
        ]);
      }
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Strengths', 'Weaknesses', 'Opportunities', 'Threats']],
        body: swotData,
        styles: { fontSize: 8, cellWidth: 'wrap' },
        headStyles: { fillColor: [30, 41, 59] },
        columnStyles: { 0: { cellWidth: usable / 4 }, 1: { cellWidth: usable / 4 }, 2: { cellWidth: usable / 4 }, 3: { cellWidth: usable / 4 } },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    addSection('Recommendation Details', content?.recommendation_details);

    if (content?.conditions?.length) {
      checkPage(20);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Conditions:', margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      content.conditions.forEach((c, i) => {
        checkPage(6);
        doc.text(`${i + 1}. ${c}`, margin + 4, y);
        y += 5;
      });
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Intelli-Credit • Confidential • Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
      doc.setTextColor(0);
    }

    doc.save(`Credit_Report_${company.company_name.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading report…</div>;
  if (!report || !company) return <div className="text-center py-16 text-muted-foreground">Report not found.</div>;

  const content = report.content;
  const recColor = report.recommendation === 'Approve' ? 'bg-risk-low/15 text-risk-low' :
    report.recommendation === 'Conditional Approval' ? 'bg-risk-medium/15 text-risk-medium' :
    'bg-risk-high/15 text-risk-high';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/companies/${companyId}`)} className="shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">Credit Assessment Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {company.company_name} • Generated {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" /> Download Report
        </Button>
      </div>

      {/* Recommendation Banner */}
      <div className={`metric-card flex items-center justify-between ${recColor} border-0`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Final Recommendation</p>
          <p className="text-2xl font-display font-bold mt-1">{report.recommendation}</p>
        </div>
        {score && (
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Credit Score</p>
            <p className="text-2xl font-display font-bold mt-1">{score.total_score}/100 <span className="text-sm">({score.credit_grade})</span></p>
          </div>
        )}
      </div>

      {/* Executive Summary */}
      <div className="metric-card">
        <h2 className="section-title mb-3">Executive Summary</h2>
        <p className="text-sm leading-relaxed">{cleanText(content?.executive_summary)}</p>
      </div>

      {/* Company Overview */}
      <div className="metric-card">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Company Overview
        </h2>
        <p className="text-sm leading-relaxed">{cleanText(content?.company_overview)}</p>
      </div>

      {/* Financial Analysis */}
      <div className="metric-card">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Financial Analysis
        </h2>
        <p className="text-sm leading-relaxed">{cleanText(content?.financial_analysis)}</p>
      </div>

      {/* Risk Assessment */}
      <div className="metric-card">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Risk Assessment
        </h2>
        <p className="text-sm leading-relaxed">{cleanText(content?.risk_assessment)}</p>
      </div>

      {/* Credit Score Analysis */}
      {score && (
        <div className="metric-card">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Credit Score Breakdown
          </h2>
          <p className="text-sm leading-relaxed mb-4">{cleanText(content?.credit_score_analysis)}</p>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Character', score: score.character_score, max: 25 },
              { label: 'Capacity', score: score.capacity_score, max: 25 },
              { label: 'Capital', score: score.capital_score, max: 20 },
              { label: 'Collateral', score: score.collateral_score, max: 15 },
              { label: 'Conditions', score: score.conditions_score, max: 15 },
            ].map(c => {
              const pct = c.score && c.max ? (c.score / c.max) * 100 : 0;
              return (
                <div key={c.label} className="text-center">
                  <p className="text-lg font-display font-bold">{c.score ?? 0}<span className="text-xs text-muted-foreground">/{c.max}</span></p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-risk-low' : pct >= 50 ? 'bg-risk-medium' : 'bg-risk-high'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{c.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SWOT */}
      {content?.swot && (
        <div>
          <h2 className="section-title mb-3">SWOT Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              { title: 'Strengths', items: content.swot.strengths, icon: CheckCircle2, color: 'text-risk-low', bg: 'bg-risk-low/10' },
              { title: 'Weaknesses', items: content.swot.weaknesses, icon: XCircle, color: 'text-risk-high', bg: 'bg-risk-high/10' },
              { title: 'Opportunities', items: content.swot.opportunities, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
              { title: 'Threats', items: content.swot.threats, icon: AlertTriangle, color: 'text-risk-medium', bg: 'bg-risk-medium/10' },
            ] as const).map(section => (
              <div key={section.title} className="metric-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${section.bg}`}>
                    <section.icon className={`w-3.5 h-3.5 ${section.color}`} />
                  </div>
                  <h3 className="font-display font-semibold text-sm">{section.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {section.items?.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Details */}
      <div className="metric-card">
        <h2 className="section-title mb-3">Recommendation Details</h2>
        <p className="text-sm leading-relaxed">{cleanText(content?.recommendation_details)}</p>
        {content?.conditions && content.conditions.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conditions</p>
            <ol className="space-y-1">
              {content.conditions.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground">{i + 1}. {c}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
