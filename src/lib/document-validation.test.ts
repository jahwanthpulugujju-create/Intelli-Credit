import { describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_BYTES, validateDocument } from './document-validation';

describe('financial document selection', () => {
  it('accepts a PDF at the documented size limit', () => {
    expect(validateDocument({ name: 'report.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES })).toBeNull();
  });

  it.each(['REPORT.PDF', 'ledger.xlsx', 'historical.xls', 'cashflow.csv', 'scan.png', 'scan.jpeg'])(
    'accepts supported extensions when the browser omits MIME type: %s', name => {
      expect(validateDocument({ name, type: '', size: 1024 })).toBeNull();
    },
  );

  it('rejects files above the limit before upload', () => {
    expect(validateDocument({ name: 'report.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 })).toMatch(/20 MB/);
  });

  it('rejects empty documents and unsupported files', () => {
    expect(validateDocument({ name: 'report.pdf', type: 'application/pdf', size: 0 })).toMatch(/empty/);
    expect(validateDocument({ name: 'program.exe', type: 'application/octet-stream', size: 100 })).not.toBeNull();
    expect(validateDocument({ name: 'program.pdf.exe', type: '', size: 100 })).not.toBeNull();
  });
});
