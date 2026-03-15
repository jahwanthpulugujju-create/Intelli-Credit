import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Database, GripVertical } from 'lucide-react';

interface SchemaField {
  id?: string;
  field_name: string;
  field_type: string;
  source_document: string;
  is_required: boolean;
  display_order: number;
}

const FIELD_TYPES = ['Number', 'Percentage', 'Ratio', 'Currency (INR)', 'Text', 'Date'];
const SOURCE_DOCS = ['Annual Report', 'Borrowing Profile', 'Shareholding Pattern', 'ALM Report', 'Portfolio Data', 'P&L Statement', 'Balance Sheet', 'Cash Flow'];

const DEFAULT_FIELDS: SchemaField[] = [
  { field_name: 'Revenue', field_type: 'Currency (INR)', source_document: 'Annual Report', is_required: true, display_order: 0 },
  { field_name: 'EBITDA', field_type: 'Currency (INR)', source_document: 'Annual Report', is_required: true, display_order: 1 },
  { field_name: 'Net Profit', field_type: 'Currency (INR)', source_document: 'P&L Statement', is_required: true, display_order: 2 },
  { field_name: 'Total Debt', field_type: 'Currency (INR)', source_document: 'Borrowing Profile', is_required: true, display_order: 3 },
  { field_name: 'Total Assets', field_type: 'Currency (INR)', source_document: 'Balance Sheet', is_required: true, display_order: 4 },
  { field_name: 'Promoter Holding', field_type: 'Percentage', source_document: 'Shareholding Pattern', is_required: false, display_order: 5 },
  { field_name: 'Interest Coverage', field_type: 'Ratio', source_document: 'Annual Report', is_required: false, display_order: 6 },
  { field_name: 'ALM Mismatch', field_type: 'Currency (INR)', source_document: 'ALM Report', is_required: false, display_order: 7 },
  { field_name: 'Cash Flow from Ops', field_type: 'Currency (INR)', source_document: 'Cash Flow', is_required: false, display_order: 8 },
];

export default function SchemaEditor({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [schemaId, setSchemaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchema();
  }, [companyId]);

  const loadSchema = async () => {
    const { data: schemas } = await (supabase as any)
      .from('extraction_schemas')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);

    if (schemas && schemas.length > 0) {
      setSchemaId(schemas[0].id);
      const { data: fieldData } = await (supabase as any)
        .from('extraction_schema_fields')
        .select('*')
        .eq('schema_id', schemas[0].id)
        .order('display_order');
      setFields((fieldData || []).map((f: any) => ({
        id: f.id,
        field_name: f.field_name,
        field_type: f.field_type,
        source_document: f.source_document,
        is_required: f.is_required,
        display_order: f.display_order,
      })));
    } else {
      setFields(DEFAULT_FIELDS);
    }
    setLoading(false);
  };

  const addField = () => {
    setFields(prev => [...prev, {
      field_name: '',
      field_type: 'Number',
      source_document: 'Annual Report',
      is_required: false,
      display_order: prev.length,
    }]);
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: any) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
  };

  const saveSchema = async () => {
    if (!user) return;
    const validFields = fields.filter(f => f.field_name.trim());
    if (validFields.length === 0) { toast.error('Add at least one field.'); return; }

    setSaving(true);
    try {
      let sid = schemaId;

      if (!sid) {
        const { data, error } = await (supabase as any).from('extraction_schemas').insert({
          company_id: companyId,
          created_by: user.id,
          schema_name: 'Default Schema',
        }).select('id').single();
        if (error) throw error;
        sid = data.id;
        setSchemaId(sid);
      }

      // Delete existing fields and re-insert
      await (supabase as any).from('extraction_schema_fields').delete().eq('schema_id', sid);

      const inserts = validFields.map((f, i) => ({
        schema_id: sid!,
        field_name: f.field_name,
        field_type: f.field_type,
        source_document: f.source_document,
        is_required: f.is_required,
        display_order: i,
      }));

      const { error } = await (supabase as any).from('extraction_schema_fields').insert(inserts);
      if (error) throw error;

      toast.success('Extraction schema saved successfully.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save schema');
    }
    setSaving(false);
  };

  if (loading) return <div className="metric-card animate-pulse h-40" />;

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Dynamic Extraction Schema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addField} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Field
          </Button>
          <Button size="sm" onClick={saveSchema} disabled={saving} className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving...' : 'Save Schema'}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[24px_1fr_140px_160px_70px_32px] gap-2 mb-2 px-1">
        <span />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Field Name</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Source Document</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Req</span>
        <span />
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {fields.map((field, i) => (
          <div
            key={i}
            className="grid grid-cols-[24px_1fr_140px_160px_70px_32px] gap-2 items-center px-1 py-1.5 rounded-lg hover:bg-muted/30 transition-colors group animate-fade-in"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 cursor-grab" />
            <Input
              value={field.field_name}
              onChange={e => updateField(i, 'field_name', e.target.value)}
              placeholder="e.g. Revenue"
              className="h-8 text-xs bg-muted/40 border-border/40"
            />
            <select
              value={field.field_type}
              onChange={e => updateField(i, 'field_type', e.target.value)}
              className="h-8 text-xs rounded-md border border-border/40 bg-muted/40 px-2 text-foreground"
            >
              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={field.source_document}
              onChange={e => updateField(i, 'source_document', e.target.value)}
              className="h-8 text-xs rounded-md border border-border/40 bg-muted/40 px-2 text-foreground"
            >
              {SOURCE_DOCS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={field.is_required}
                onChange={e => updateField(i, 'is_required', e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-accent"
              />
            </div>
            <button
              onClick={() => removeField(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No fields defined. Click "Add Field" to configure your extraction schema.
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-3">
        Define the fields you want the AI to extract from uploaded documents. The schema will be used during the financial extraction step.
      </p>
    </div>
  );
}
