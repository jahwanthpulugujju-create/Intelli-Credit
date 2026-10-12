export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_EXTENSIONS = '.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg';

const acceptedTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'image/png',
  'image/jpeg',
]);

/** Client-side selection checks. Storage and backend must validate content independently. */
export function validateDocument(file: Pick<File, 'name' | 'size' | 'type'>): string | null {
  if (file.size === 0) return 'The document is empty.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Documents must be 20 MB or smaller.';
  if (!acceptedTypes.has(file.type) && !/\.(pdf|xlsx|xls|csv|png|jpg|jpeg)$/i.test(file.name)) {
    return 'Choose a PDF, Excel, CSV, PNG, or JPEG document.';
  }
  return null;
}
