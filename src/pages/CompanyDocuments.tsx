import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  FileText,
  Filter,
} from 'lucide-react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import ClassificationReview from '@/components/documents/ClassificationReview';

type FilterType = 'all' | 'pending' | 'approved' | 'corrected' | 'rejected';

interface DocumentRow {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  classification?: {
    id: string;
    document_id: string;
    detected_type: string;
    confidence: number | null;
    status: string;
    approved_type: string | null;
    approved_by: string | null;
  } | null;
}

export default function CompanyDocuments() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchDocuments = useCallback(async () => {
    if (!companyId) return;

    const { data: company } = await supabase
      .from('companies')
      .select('company_name')
      .eq('id', companyId)
      .single();

    if (company) setCompanyName(company.company_name);

    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (!docs) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    // Fetch classifications for all docs
    const docIds = docs.map(d => d.id);
    const { data: classifications } = await supabase
      .from('document_classifications')
      .select('*')
      .in('document_id', docIds);

    const classMap = new Map(
      (classifications ?? []).map(c => [c.document_id, c])
    );

    const enriched: DocumentRow[] = docs.map(d => ({
      ...d,
      classification: classMap.get(d.id) || null,
    }));

    setDocuments(enriched);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchDocuments();
    // Poll for classification updates every 5s
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const filtered = documents.filter(d => {
    if (filter === 'all') return true;
    return d.classification?.status === filter || (!d.classification && filter === 'pending');
  });

  const statusBadge = (doc: DocumentRow) => {
    const status = doc.classification?.status;
    switch (status) {
      case 'approved':
        return <Badge className="bg-risk-low/15 text-risk-low border-0">Approved</Badge>;
      case 'corrected':
        return <Badge className="bg-accent/15 text-accent border-0">Corrected</Badge>;
      case 'rejected':
        return <Badge className="bg-risk-high/15 text-risk-high border-0">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-risk-medium/15 text-risk-medium border-0">Needs Review</Badge>;
      default:
        return <Badge variant="secondary">Processing…</Badge>;
    }
  };

  const confidenceBadge = (confidence: number | null) => {
    if (confidence === null) return <span className="text-xs text-muted-foreground">—</span>;
    const pct = Math.round(confidence * 100);
    const color = pct >= 80 ? 'text-risk-low' : pct >= 50 ? 'text-risk-medium' : 'text-risk-high';
    return <span className={`text-xs font-semibold ${color}`}>{pct}%</span>;
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All Documents', value: 'all' },
    { label: 'Needs Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/companies')} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">{companyName || 'Documents'}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Upload and classify financial documents for analysis
          </p>
        </div>
      </div>

      {/* Uploader */}
      <DocumentUploader companyId={companyId!} onUploadComplete={fetchDocuments} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-accent/15 text-accent'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading documents…</div>
      ) : filtered.length === 0 ? (
        <div className="metric-card text-center py-12">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {documents.length === 0
              ? 'No documents uploaded yet. Drop your files above to get started.'
              : 'No documents match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="metric-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Document</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Upload Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Detected Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Confidence</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(doc => (
                <TableRow key={doc.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {doc.classification?.approved_type || doc.classification?.detected_type || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {confidenceBadge(doc.classification?.confidence ?? null)}
                  </TableCell>
                  <TableCell>{statusBadge(doc)}</TableCell>
                  <TableCell>
                    {doc.classification && doc.classification.status === 'pending' ? (
                      <ClassificationReview
                        classification={doc.classification}
                        fileName={doc.file_name}
                        onUpdate={fetchDocuments}
                      />
                    ) : doc.classification ? (
                      <span className="text-xs text-muted-foreground">Reviewed</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Classifying…</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
