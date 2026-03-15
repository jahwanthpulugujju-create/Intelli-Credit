import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DocumentUploader from '@/components/documents/DocumentUploader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileText,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  company_name: string;
  sector: string;
}

interface RecentDoc {
  id: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  company_id: string;
  company_name?: string;
  classification_status?: string;
  detected_type?: string;
  confidence?: number | null;
}

export default function UploadDocuments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, company_name, sector')
      .order('company_name');
    setCompanies(data ?? []);
  }, []);

  const fetchRecentDocs = useCallback(async () => {
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!docs || docs.length === 0) {
      setRecentDocs([]);
      setLoading(false);
      return;
    }

    // Fetch company names
    const companyIds = [...new Set(docs.map(d => d.company_id))];
    const { data: companiesData } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('id', companyIds);
    const companyMap = new Map((companiesData ?? []).map(c => [c.id, c.company_name]));

    // Fetch classifications
    const docIds = docs.map(d => d.id);
    const { data: classifications } = await supabase
      .from('document_classifications')
      .select('document_id, status, detected_type, confidence')
      .in('document_id', docIds);
    const classMap = new Map((classifications ?? []).map(c => [c.document_id, c]));

    const enriched: RecentDoc[] = docs.map(d => {
      const cls = classMap.get(d.id);
      return {
        ...d,
        company_name: companyMap.get(d.company_id) ?? 'Unknown',
        classification_status: cls?.status,
        detected_type: cls?.detected_type,
        confidence: cls?.confidence,
      };
    });

    setRecentDocs(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchRecentDocs();
  }, [fetchCompanies, fetchRecentDocs]);

  // Poll for classification updates
  useEffect(() => {
    const interval = setInterval(fetchRecentDocs, 5000);
    return () => clearInterval(interval);
  }, [fetchRecentDocs]);

  const handleUploadComplete = () => {
    toast.success('Documents uploaded successfully! Classification in progress.');
    fetchRecentDocs();
  };

  const statusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'corrected':
        return <CheckCircle2 className="w-4 h-4 text-risk-low" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-risk-medium" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-risk-high" />;
      default:
        return <Sparkles className="w-4 h-4 text-accent animate-glow-pulse" />;
    }
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-risk-low/15 text-risk-low border-0 text-[10px]">Approved</Badge>;
      case 'corrected':
        return <Badge className="bg-accent/15 text-accent border-0 text-[10px]">Corrected</Badge>;
      case 'pending':
        return <Badge className="bg-risk-medium/15 text-risk-medium border-0 text-[10px]">Needs Review</Badge>;
      case 'rejected':
        return <Badge className="bg-risk-high/15 text-risk-high border-0 text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Classifying…</Badge>;
    }
  };

  const fileIcon = (type: string | null) => {
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const stats = {
    total: recentDocs.length,
    classified: recentDocs.filter(d => d.classification_status).length,
    pending: recentDocs.filter(d => d.classification_status === 'pending').length,
    approved: recentDocs.filter(d => d.classification_status === 'approved' || d.classification_status === 'corrected').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Document Hub</span>
        </div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload financial documents for AI-powered classification and analysis
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: stats.total, icon: FileText },
          { label: 'Classified', value: stats.classified, icon: Sparkles },
          { label: 'Needs Review', value: stats.pending, icon: Clock },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2 },
        ].map((s, i) => (
          <div key={s.label} className="metric-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload section */}
      <div className="glow-card">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-accent" />
          <h2 className="font-display font-semibold text-lg">Upload New Documents</h2>
        </div>

        {/* Company selector */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Select Company
          </label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-11 bg-muted/50 border-border/60 focus:border-accent focus:ring-accent/20 max-w-md">
              <SelectValue placeholder="Choose a company to upload documents for…" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {c.company_name}
                    <span className="text-muted-foreground text-xs">· {c.sector}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {companies.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground mt-2">
              No companies found.{' '}
              <button onClick={() => navigate('/companies/new')} className="text-accent hover:underline">
                Onboard a company first
              </button>
            </p>
          )}
        </div>

        {/* Uploader */}
        {selectedCompany ? (
          <DocumentUploader companyId={selectedCompany} onUploadComplete={handleUploadComplete} />
        ) : (
          <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Select a company above to start uploading documents
            </p>
          </div>
        )}
      </div>

      {/* Recent documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Recent Uploads</h2>
          <span className="text-xs text-muted-foreground">{recentDocs.length} documents</span>
        </div>

        {loading ? (
          <div className="metric-card text-center py-12">
            <Sparkles className="w-8 h-8 mx-auto text-accent animate-glow-pulse mb-3" />
            <p className="text-sm text-muted-foreground">Loading documents…</p>
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="metric-card text-center py-12">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet. Select a company and drop your files above.
            </p>
          </div>
        ) : (
          <div className="metric-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Document</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Company</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Confidence</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Uploaded</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDocs.map((doc, idx) => (
                  <TableRow
                    key={doc.id}
                    className="group animate-fade-in"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {fileIcon(doc.file_type)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px]">{doc.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{doc.company_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{doc.detected_type || '—'}</span>
                    </TableCell>
                    <TableCell>
                      {doc.confidence != null ? (
                        <span className={`text-xs font-semibold ${
                          Math.round(doc.confidence * 100) >= 80
                            ? 'text-risk-low'
                            : Math.round(doc.confidence * 100) >= 50
                            ? 'text-risk-medium'
                            : 'text-risk-high'
                        }`}>
                          {Math.round(doc.confidence * 100)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(doc.classification_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate(`/companies/${doc.company_id}/documents`)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}