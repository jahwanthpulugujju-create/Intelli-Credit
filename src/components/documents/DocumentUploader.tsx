import { useState, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentUploaderProps {
  companyId: string;
  onUploadComplete: () => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'image/png',
  'image/jpeg',
];

const ACCEPTED_EXTENSIONS = '.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg';

export default function DocumentUploader({ companyId, onUploadComplete }: DocumentUploaderProps) {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      ACCEPTED_TYPES.includes(f.type) || f.name.match(/\.(pdf|xlsx|xls|csv|png|jpg|jpeg)$/i)
    );
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const uploadFiles = async () => {
    if (!user || files.length === 0) return;
    setUploading(true);
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${companyId}/${Date.now()}_${file.name}`;

      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from('financial-documents')
        .upload(filePath, file);

      if (storageError) {
        console.error('Storage error:', storageError);
        continue;
      }

      // Insert document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (docError) {
        console.error('Document insert error:', docError);
        continue;
      }

      // Trigger classification
      if (docData) {
        supabase.functions.invoke('analyze-document-type', {
          body: { documentId: docData.id, fileName: file.name, fileType: file.type },
        }).catch(console.error);
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setFiles([]);
    setUploading(false);
    setProgress(0);
    onUploadComplete();
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent/40 hover:bg-muted/30'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium mb-1">Drop your financial documents here</p>
        <p className="text-xs text-muted-foreground mb-4">
          PDF, Excel, CSV, or images — up to 20MB each
        </p>
        <label>
          <input
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">Browse Files</span>
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {uploading && <Progress value={progress} className="h-2" />}

          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading {progress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} document{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
