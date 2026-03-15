import { useState } from 'react';
import { Check, Pencil, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DOCUMENT_TYPES = [
  'ALM Statement',
  'Shareholding Pattern',
  'Borrowing Profile',
  'Annual Report',
  'Portfolio Performance Data',
  'Unknown',
];

interface Classification {
  id: string;
  document_id: string;
  detected_type: string;
  confidence: number | null;
  status: string;
  approved_type: string | null;
  approved_by: string | null;
}

interface ClassificationReviewProps {
  classification: Classification;
  fileName: string;
  onUpdate: () => void;
}

export default function ClassificationReview({ classification, fileName, onUpdate }: ClassificationReviewProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(classification.detected_type);

  const confidence = classification.confidence ?? 0;
  const confidencePercent = Math.round(confidence * 100);

  const handleApprove = async () => {
    await supabase
      .from('document_classifications')
      .update({
        status: 'approved',
        approved_type: classification.detected_type,
        approved_by: user?.id,
      })
      .eq('id', classification.id);
    onUpdate();
  };

  const handleCorrect = async () => {
    await supabase
      .from('document_classifications')
      .update({
        status: 'corrected',
        approved_type: selectedType,
        approved_by: user?.id,
      })
      .eq('id', classification.id);
    setEditing(false);
    onUpdate();
  };

  const handleReject = async () => {
    await supabase
      .from('document_classifications')
      .update({
        status: 'rejected',
        approved_by: user?.id,
      })
      .eq('id', classification.id);
    onUpdate();
  };

  const statusBadge = () => {
    switch (classification.status) {
      case 'approved':
        return <Badge className="bg-risk-low/15 text-risk-low border-0 text-xs">Approved</Badge>;
      case 'corrected':
        return <Badge className="bg-accent/15 text-accent border-0 text-xs">Corrected</Badge>;
      case 'rejected':
        return <Badge className="bg-risk-high/15 text-risk-high border-0 text-xs">Rejected</Badge>;
      default:
        return <Badge className="bg-risk-medium/15 text-risk-medium border-0 text-xs">Needs Review</Badge>;
    }
  };

  const confidenceColor = confidencePercent >= 80 ? 'text-risk-low' : confidencePercent >= 50 ? 'text-risk-medium' : 'text-risk-high';

  if (classification.status !== 'pending' && !editing) {
    return (
      <div className="flex items-center gap-2">
        {statusBadge()}
        <span className="text-xs text-muted-foreground">
          {classification.approved_type || classification.detected_type}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            We detected <strong className="text-foreground">{fileName}</strong> as{' '}
            <strong className="text-accent">{classification.detected_type}</strong> with{' '}
            <strong className={confidenceColor}>{confidencePercent}% confidence</strong>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Please confirm or correct the classification.
          </p>
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-8 text-xs w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleCorrect} className="h-8 text-xs">
            <Check className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 text-xs">
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleApprove} className="h-8 text-xs bg-risk-low/15 text-risk-low hover:bg-risk-low/25 border-0">
            <Check className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 text-xs">
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject} className="h-8 text-xs text-risk-high hover:bg-risk-high/10 hover:text-risk-high">
            <X className="w-3 h-3 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
