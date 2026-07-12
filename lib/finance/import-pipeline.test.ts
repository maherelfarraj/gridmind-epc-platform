/**
 * Import pipeline unit tests — edge cases
 *
 * Tests the pure utility functions in rate-limit.ts and import-schema.ts that
 * can run without a DB connection or network access.
 *
 * Coverage:
 *  - validateMagicBytes: correct format detection for PDF, XLSX, XLS, CSV, plain text, BOM
 *  - validateMagicBytes: rejects unknown binary, null header, truncated buffer
 *  - detectZipBomb: rejects suspiciously small ZIP, accepts normal-sized XLSX
 *  - UPLOAD_LIMITS: size, MIME, counts are correctly specified
 *  - financeExtractionSchema: validates correct payloads and rejects bad ones
 *  - Edge cases: empty buffers, all-zero buffers, single-byte buffers
 */

import { describe, expect, it } from 'vitest'
import { detectZipBomb, UPLOAD_LIMITS, validateMagicBytes } from './rate-limit-pure'
import { financeExtractionSchema } from './import-schema'

// ─── Buffer factories ─────────────────────────────────────────────────────────

function pdfBuffer(size = 16): Uint8Array {
  const b = new Uint8Array(size).fill(0x20)
  b[0] = 0x25; b[1] = 0x50; b[2] = 0x44; b[3] = 0x46  // %PDF
  return b
}

function xlsxBuffer(size = 2048): Uint8Array {
  const b = new Uint8Array(size).fill(0x20)
  b[0] = 0x50; b[1] = 0x4b; b[2] = 0x03; b[3] = 0x04  // PK (ZIP)
  return b
}

function xlsxBufferTiny(size = 512): Uint8Array {
  const b = new Uint8Array(size).fill(0x20)
  b[0] = 0x50; b[1] = 0x4b; b[2] = 0x03; b[3] = 0x04  // PK — but too small
  return b
}

function xlsBuffer(size = 16): Uint8Array {
  const b = new Uint8Array(size).fill(0x00)
  b[0] = 0xd0; b[1] = 0xcf; b[2] = 0x11; b[3] = 0xe0  // OLE2
  return b
}

function csvBuffer(): Uint8Array {
  const text = 'Period,Revenue,Cost\n1,1000000,500000\n2,1050000,525000\n'
  return new Uint8Array(Buffer.from(text, 'utf8'))
}

function csvBomBuffer(): Uint8Array {
  const bytes = [0xef, 0xbb, 0xbf, ...Array.from(Buffer.from('Period,Revenue\n1,1000\n'))]
  return new Uint8Array(bytes)
}

function unknownBinaryBuffer(): Uint8Array {
  // ELF magic — definitely not a finance doc
  return new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
}

// ─── validateMagicBytes ───────────────────────────────────────────────────────

describe('validateMagicBytes — accepted formats', () => {
  it('accepts a PDF buffer (%PDF header)', () => {
    expect(validateMagicBytes(pdfBuffer())).toBe(true)
  })

  it('accepts an XLSX / ZIP buffer (PK header)', () => {
    expect(validateMagicBytes(xlsxBuffer())).toBe(true)
  })

  it('accepts an XLS / OLE2 buffer (D0 CF header)', () => {
    expect(validateMagicBytes(xlsBuffer())).toBe(true)
  })

  it('accepts a plain CSV buffer (printable ASCII first byte)', () => {
    expect(validateMagicBytes(csvBuffer())).toBe(true)
  })

  it('accepts a UTF-8 BOM prefixed CSV', () => {
    expect(validateMagicBytes(csvBomBuffer())).toBe(true)
  })

  it('accepts a minimal printable text buffer (single line)', () => {
    const b = new Uint8Array(Buffer.from('Period,Value'))
    expect(validateMagicBytes(b)).toBe(true)
  })
})

describe('validateMagicBytes — rejected formats', () => {
  it('rejects an ELF binary (Linux executable magic)', () => {
    expect(validateMagicBytes(unknownBinaryBuffer())).toBe(false)
  })

  it('rejects an all-zero buffer', () => {
    expect(validateMagicBytes(new Uint8Array(16))).toBe(false)
  })

  it('rejects a buffer starting with a null byte', () => {
    const b = new Uint8Array([0x00, 0x01, 0x02, 0x03])
    expect(validateMagicBytes(b)).toBe(false)
  })

  it('rejects a control-character header', () => {
    const b = new Uint8Array([0x01, 0x02, 0x03, 0x04])
    expect(validateMagicBytes(b)).toBe(false)
  })

  it('handles a single-byte buffer (PDF magic incomplete) without throwing', () => {
    const b = new Uint8Array([0x25])  // just '%', not '%PDF'
    // First byte 0x25 = printable ASCII — should be accepted as plain text
    expect(typeof validateMagicBytes(b)).toBe('boolean')
  })

  it('handles an empty buffer without throwing', () => {
    expect(() => validateMagicBytes(new Uint8Array(0))).not.toThrow()
  })
})

// ─── detectZipBomb ────────────────────────────────────────────────────────────

describe('detectZipBomb', () => {
  it('flags a ZIP buffer under 1 kB as a potential bomb', () => {
    expect(detectZipBomb(xlsxBufferTiny(512))).toBe(true)
  })

  it('flags a ZIP buffer of exactly 1023 bytes as a potential bomb', () => {
    expect(detectZipBomb(xlsxBufferTiny(1023))).toBe(true)
  })

  it('accepts a ZIP buffer of exactly 1024 bytes', () => {
    expect(detectZipBomb(xlsxBuffer(1024))).toBe(false)
  })

  it('accepts a normal-sized XLSX (> 1 kB)', () => {
    expect(detectZipBomb(xlsxBuffer(8192))).toBe(false)
  })

  it('does not flag a PDF (non-ZIP) as a bomb regardless of size', () => {
    expect(detectZipBomb(pdfBuffer(512))).toBe(false)
  })

  it('does not flag a CSV as a bomb', () => {
    expect(detectZipBomb(csvBuffer())).toBe(false)
  })
})

// ─── UPLOAD_LIMITS constants ──────────────────────────────────────────────────

describe('UPLOAD_LIMITS constants', () => {
  it('MAX_FILE_SIZE_BYTES is 50 MB', () => {
    expect(UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024)
  })

  it('includes application/pdf as allowed MIME type', () => {
    expect(UPLOAD_LIMITS.ALLOWED_MIME_TYPES).toContain('application/pdf')
  })

  it('includes XLSX MIME type', () => {
    expect(UPLOAD_LIMITS.ALLOWED_MIME_TYPES).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  })

  it('includes XLS MIME type', () => {
    expect(UPLOAD_LIMITS.ALLOWED_MIME_TYPES).toContain('application/vnd.ms-excel')
  })

  it('includes CSV MIME types', () => {
    expect(UPLOAD_LIMITS.ALLOWED_MIME_TYPES).toContain('text/csv')
  })

  it('MAX_IMPORTS_PER_HOUR is a positive integer', () => {
    expect(UPLOAD_LIMITS.MAX_IMPORTS_PER_HOUR).toBeGreaterThan(0)
    expect(Number.isInteger(UPLOAD_LIMITS.MAX_IMPORTS_PER_HOUR)).toBe(true)
  })

  it('MAX_INFLIGHT_IMPORTS is a positive integer', () => {
    expect(UPLOAD_LIMITS.MAX_INFLIGHT_IMPORTS).toBeGreaterThan(0)
    expect(Number.isInteger(UPLOAD_LIMITS.MAX_INFLIGHT_IMPORTS)).toBe(true)
  })
})

// ─── financeExtractionSchema validation ───────────────────────────────────────

describe('financeExtractionSchema — valid payloads', () => {
  const minimalField = {
    key: 'capacityMwp', label: 'Installed capacity', value: 50, unit: 'MWp',
    confidence: 0.98, evidence: 'Project title: Reference 50 MWp', location: 'PDF p1',
    transformation: 'Read directly from document title', status: 'mapped',
  }

  it('accepts a minimal valid extraction payload', () => {
    const payload = {
      documentTitle: 'Reference 50 MWp Solar IPP',
      detectedTemplate: 'solar-ipp',
      currency: 'USD',
      periodLabels: ['S1', 'S2', 'S3'],
      summary: 'Operating and admin schedules extracted across S1–S20.',
      fields: [minimalField],
      warnings: [],
    }
    const result = financeExtractionSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('accepts status "ambiguous" and "conflict" field statuses', () => {
    const ambiguous = { ...minimalField, status: 'ambiguous' as const }
    const conflict  = { ...minimalField, status: 'conflict'  as const }
    expect(financeExtractionSchema.shape.fields.element.safeParse(ambiguous).success).toBe(true)
    expect(financeExtractionSchema.shape.fields.element.safeParse(conflict).success).toBe(true)
  })

  it('accepts an unknown template detection', () => {
    const payload = {
      documentTitle: 'Mystery Model', detectedTemplate: 'unknown', currency: 'EUR',
      periodLabels: [], summary: 'Unknown doc.', fields: [], warnings: [],
    }
    const result = financeExtractionSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('accepts confidence of exactly 0 and exactly 1', () => {
    const low  = { ...minimalField, confidence: 0 }
    const high = { ...minimalField, confidence: 1 }
    expect(financeExtractionSchema.shape.fields.element.safeParse(low).success).toBe(true)
    expect(financeExtractionSchema.shape.fields.element.safeParse(high).success).toBe(true)
  })
})

describe('financeExtractionSchema — invalid payloads', () => {
  it('rejects confidence > 1', () => {
    const bad = {
      key: 'capacityMwp', label: 'Cap', value: 50, unit: 'MWp',
      confidence: 1.5, evidence: 'x', location: 'p1', transformation: 'y', status: 'mapped',
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(bad).success).toBe(false)
  })

  it('rejects confidence < 0', () => {
    const bad = {
      key: 'capex', label: 'CAPEX', value: 50000000, unit: 'USD',
      confidence: -0.1, evidence: 'x', location: 'p2', transformation: 'z', status: 'mapped',
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(bad).success).toBe(false)
  })

  it('rejects an invalid field status', () => {
    const bad = {
      key: 'capex', label: 'CAPEX', value: 50000000, unit: 'USD',
      confidence: 0.9, evidence: 'x', location: 'p2', transformation: 'z', status: 'approved',
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(bad).success).toBe(false)
  })

  it('rejects an invalid detectedTemplate value', () => {
    const bad = {
      documentTitle: 'Test', detectedTemplate: 'wind-energy', currency: 'USD',
      periodLabels: [], summary: 'x', fields: [], warnings: [],
    }
    expect(financeExtractionSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a missing required field (documentTitle)', () => {
    const bad = {
      detectedTemplate: 'solar-ipp', currency: 'USD',
      periodLabels: [], summary: 'x', fields: [], warnings: [],
    }
    expect(financeExtractionSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects fields array exceeding max length (150)', () => {
    const field = {
      key: 'x', label: 'x', value: 1, unit: 'USD', confidence: 0.5,
      evidence: 'e', location: 'l', transformation: 't', status: 'mapped' as const,
    }
    const bad = {
      documentTitle: 'Big', detectedTemplate: 'solar-ipp', currency: 'USD',
      periodLabels: [], summary: 'x',
      fields: Array.from({ length: 151 }, () => field),
      warnings: [],
    }
    expect(financeExtractionSchema.safeParse(bad).success).toBe(false)
  })
})

// ─── Edge-case numeric inputs to the extraction schema ────────────────────────

describe('financeExtractionSchema — edge-case values', () => {
  it('accepts a negative value (costs, losses)', () => {
    const field = {
      key: 'netCashFlow', label: 'Net CF', value: -500000, unit: 'USD',
      confidence: 0.9, evidence: 'Row total = (500,000)', location: 'Sheet1!B20',
      transformation: 'Parenthesised negative interpreted as debit', status: 'mapped' as const,
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(field).success).toBe(true)
  })

  it('accepts a percentage expressed as a decimal (0.175 = 17.5%)', () => {
    const field = {
      key: 'grossMarginRate', label: 'Gross Margin', value: 0.175, unit: 'decimal',
      confidence: 0.88, evidence: 'Cell D4 = 17.5%', location: 'Summary!D4',
      transformation: 'Divided by 100 to normalise to decimal', status: 'mapped' as const,
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(field).success).toBe(true)
  })

  it('accepts a large capex value', () => {
    const field = {
      key: 'capex', label: 'Total CAPEX', value: 1_250_000_000, unit: 'USD',
      confidence: 0.95, evidence: '1,250,000,000', location: 'p3',
      transformation: 'No transformation required', status: 'mapped' as const,
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(field).success).toBe(true)
  })

  it('accepts an ambiguous mapping with low confidence', () => {
    const field = {
      key: 'opexPerMwp', label: 'O&M Cost', value: 18000, unit: 'USD/MWp',
      confidence: 0.45, evidence: 'Unclear row header "Variable O&M"', location: 'Sheet2!F12',
      transformation: 'Interpreted as USD/MWp/yr — uncertain', status: 'ambiguous' as const,
    }
    expect(financeExtractionSchema.shape.fields.element.safeParse(field).success).toBe(true)
  })
})
