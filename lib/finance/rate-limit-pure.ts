/**
 * lib/finance/rate-limit-pure.ts
 *
 * Pure (no-DB, no-server) validation utilities extracted from rate-limit.ts.
 * These can be imported in tests and browser code without pulling in Drizzle/Neon.
 */

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,   // 50 MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel',                                           // xls
    'text/csv',
    'application/csv',
  ],
  ALLOWED_MAGIC_BYTES: {
    pdf:  [0x25, 0x50, 0x44, 0x46],             // %PDF
    xlsx: [0x50, 0x4b, 0x03, 0x04],             // PK (ZIP-based)
    xls:  [0xd0, 0xcf, 0x11, 0xe0],             // OLE2
  },
  MAX_IMPORTS_PER_HOUR: 10,
  MAX_INFLIGHT_IMPORTS: 3,
} as const

/**
 * Sniff magic bytes from the first bytes of the file buffer to confirm
 * the declared MIME type.  Returns true if the buffer matches a known format.
 */
export function validateMagicBytes(buffer: Uint8Array): boolean {
  const b = buffer
  if (b.length === 0) return false

  // PDF: %PDF
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return true
  // ZIP/XLSX/DOCX: PK\x03\x04
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return true
  // OLE2/XLS: D0 CF 11 E0
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return true
  // CSV/plain text: valid UTF-8 BOM
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return true
  // Plain text: first byte is printable ASCII
  if (b[0] >= 0x20 && b[0] <= 0x7e) return true

  return false
}

/**
 * Detect potential zip-bomb: if the file claims to be a ZIP/XLSX but its
 * declared size is very small while having a high compression ratio hint,
 * reject it.  Simple heuristic: reject any ZIP under 1 kB.
 */
export function detectZipBomb(buffer: Uint8Array): boolean {
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b
  if (isZip && buffer.length < 1024) return true
  return false
}
