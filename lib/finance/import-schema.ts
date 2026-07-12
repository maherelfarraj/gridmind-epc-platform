import { z } from 'zod'

export const extractedFieldSchema = z.object({
  key: z.string().describe('Canonical financial model assumption key'),
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string().describe('Short verbatim source evidence or workbook cell range'),
  location: z.string().describe('PDF page or workbook sheet/cell location'),
  transformation: z.string().describe('How the source value was normalized'),
  status: z.enum(['mapped', 'ambiguous', 'conflict']),
})

export const financeExtractionSchema = z.object({
  documentTitle: z.string(),
  detectedTemplate: z.enum(['solar-ipp', 'epc', 'unknown']),
  currency: z.string(),
  periodLabels: z.array(z.string()).max(120),
  summary: z.string(),
  fields: z.array(extractedFieldSchema).max(150),
  warnings: z.array(z.string()).max(40),
})

export type FinanceExtraction = z.infer<typeof financeExtractionSchema>
export type ExtractedField = z.infer<typeof extractedFieldSchema>
