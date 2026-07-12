'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  FolderOpen,
  History,
  Info,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface Document {
  id: string
  name: string
  project: string
  category: string
  stage: number
  version: string
  uploadedBy: string
  date: string
  size: string
  status: 'approved' | 'pending' | 'under-review' | 'draft' | 'rejected'
  tags: string[]
  description: string
}

interface VersionEntry {
  version: string
  uploadedBy: string
  date: string
  size: string
  comment: string
  status: 'approved' | 'pending' | 'superseded'
}

const versionHistory: Record<string, VersionEntry[]> = {
  'DOC-001': [
    { version: '3.0', uploadedBy: 'Legal Team', date: 'Feb 5, 2024', size: '2.4 MB', comment: 'Final signed version uploaded after client execution', status: 'approved' },
    { version: '2.0', uploadedBy: 'Legal Team', date: 'Jan 22, 2024', size: '2.3 MB', comment: 'Revised terms per client redline comments — Clause 12.4 updated', status: 'superseded' },
    { version: '1.0', uploadedBy: 'Ahmed Al-Rashidi', date: 'Jan 10, 2024', size: '2.1 MB', comment: 'Initial draft issued for client review', status: 'superseded' },
  ],
  'DOC-002': [
    { version: '4.0', uploadedBy: 'Dr. Khaled', date: 'Apr 12, 2024', size: '1.1 MB', comment: 'Final approved revision incorporating consultant comments', status: 'approved' },
    { version: '3.0', uploadedBy: 'Dr. Khaled', date: 'Mar 28, 2024', size: '1.0 MB', comment: 'Updated panel quantities based on revised layout', status: 'superseded' },
    { version: '2.0', uploadedBy: 'Eng. Team', date: 'Feb 15, 2024', size: '0.9 MB', comment: 'Structural elements added to BOQ', status: 'superseded' },
  ],
  'DOC-003': [
    { version: '2.0', uploadedBy: 'Eng. Nora', date: 'Jul 1, 2024', size: '18.4 MB', comment: 'Updated cable routing and SLD per site survey findings', status: 'pending' },
    { version: '1.0', uploadedBy: 'Eng. Nora', date: 'Jun 1, 2024', size: '17.2 MB', comment: 'Initial IFC issue for construction', status: 'superseded' },
  ],
  'DOC-004': [
    { version: '1.0', uploadedBy: 'Walid Al-Saud', date: 'Jun 20, 2024', size: '0.8 MB', comment: 'Vendor comparison — 4 transformer suppliers evaluated', status: 'approved' },
  ],
  'DOC-005': [
    { version: '1.0', uploadedBy: 'HSE Manager', date: 'Oct 1, 2024', size: '3.2 MB', comment: 'Initial HSE plan for construction phase — under review by HSE Director', status: 'pending' },
  ],
  'DOC-006': [
    { version: '1.0', uploadedBy: 'Sara Al-Otaibi', date: 'Jul 5, 2024', size: '0.5 MB', comment: 'Progress certificate #7 — 68% completion claim', status: 'pending' },
  ],
  'DOC-007': [
    { version: '0.9', uploadedBy: 'T&C Manager', date: 'Jun 28, 2024', size: '1.7 MB', comment: 'Draft for internal review — system boundaries not yet confirmed', status: 'pending' },
  ],
  'DOC-008': [
    { version: '1.0', uploadedBy: 'Eng. Team', date: 'May 10, 2024', size: '4.2 MB', comment: 'Basis of design approved by client', status: 'approved' },
  ],
  'DOC-009': [
    { version: '1.1', uploadedBy: 'Ahmed', date: 'Jun 5, 2024', size: '0.4 MB', comment: 'Minor scope clarifications incorporated', status: 'approved' },
    { version: '1.0', uploadedBy: 'Ahmed', date: 'May 28, 2024', size: '0.4 MB', comment: 'Initial scope review matrix', status: 'superseded' },
  ],
  'DOC-010': [
    { version: '1.0', uploadedBy: 'Client Rep.', date: 'Jul 3, 2024', size: '0.3 MB', comment: 'PAC issued and signed by client representative', status: 'approved' },
  ],
}

const documents: Document[] = [
  { id: 'DOC-001', name: 'Contract Agreement — NEOM SOL 004', project: 'NEOM Solar Farm', category: 'Contract', stage: 2, version: '3.0', uploadedBy: 'Legal Team', date: 'Feb 5, 2024', size: '2.4 MB', status: 'approved', tags: ['Contract', 'Legal', 'Stage 2'], description: 'Executed EPC contract agreement between GSI Holding and NEOM Company for the 400MW solar farm project.' },
  { id: 'DOC-002', name: 'Main BOQ — Revision 4', project: 'NEOM Solar Farm', category: 'Engineering', stage: 3, version: '4.0', uploadedBy: 'Dr. Khaled', date: 'Apr 12, 2024', size: '1.1 MB', status: 'approved', tags: ['BOQ', 'Engineering'], description: 'Approved Bill of Quantities covering all materials, labor, and equipment for the NEOM Solar Farm project.' },
  { id: 'DOC-003', name: 'IFC Drawing Package — Electrical', project: 'NEOM Solar Farm', category: 'Drawings', stage: 3, version: '2.0', uploadedBy: 'Eng. Nora', date: 'Jul 1, 2024', size: '18.4 MB', status: 'pending', tags: ['IFC', 'Electrical', 'Drawings'], description: 'Issued-for-Construction electrical drawings including SLD, cable routing, and earthing layout.' },
  { id: 'DOC-004', name: 'Vendor Comparison — Transformers', project: 'NEOM Solar Farm', category: 'Procurement', stage: 4, version: '1.0', uploadedBy: 'Walid Al-Saud', date: 'Jun 20, 2024', size: '0.8 MB', status: 'approved', tags: ['Vendor', 'Procurement'], description: 'Commercial and technical comparison of four transformer suppliers for the 132kV step-up station.' },
  { id: 'DOC-005', name: 'HSE Plan v1.0', project: 'Jeddah Substation', category: 'HSE', stage: 5, version: '1.0', uploadedBy: 'HSE Manager', date: 'Oct 1, 2024', size: '3.2 MB', status: 'under-review', tags: ['HSE', 'Construction'], description: 'Site-specific Health, Safety & Environment plan for the Jeddah Substation construction phase.' },
  { id: 'DOC-006', name: 'Progress Certificate #7', project: 'Riyadh EPC-07', category: 'Finance', stage: 6, version: '1.0', uploadedBy: 'Sara Al-Otaibi', date: 'Jul 5, 2024', size: '0.5 MB', status: 'pending', tags: ['Finance', 'Certificate'], description: 'Interim payment certificate #7 representing 68% physical completion claim for Riyadh EPC-07.' },
  { id: 'DOC-007', name: 'T&C Detailed Plan — Draft', project: 'Yanbu Industrial', category: 'Testing', stage: 7, version: '0.9', uploadedBy: 'T&C Manager', date: 'Jun 28, 2024', size: '1.7 MB', status: 'draft', tags: ['T&C', 'Testing'], description: 'Draft testing and commissioning plan for Yanbu Industrial utilities project, covering system boundaries.' },
  { id: 'DOC-008', name: 'Site Study & Design Basis', project: 'Tabuk Solar Project', category: 'Engineering', stage: 3, version: '1.0', uploadedBy: 'Eng. Team', date: 'May 10, 2024', size: '4.2 MB', status: 'approved', tags: ['Design', 'Engineering'], description: 'Site study and design basis report establishing technical parameters for the Tabuk solar project.' },
  { id: 'DOC-009', name: 'Scope Review Matrix', project: 'KAEC Solar 400MW', category: 'Contract', stage: 1, version: '1.1', uploadedBy: 'Ahmed', date: 'Jun 5, 2024', size: '0.4 MB', status: 'approved', tags: ['Scope', 'Pre-Contract'], description: 'Scope review matrix issued during pre-contract phase to align deliverables with RFP requirements.' },
  { id: 'DOC-010', name: 'PAC Certificate — Yanbu', project: 'Yanbu Industrial', category: 'Testing', stage: 7, version: '1.0', uploadedBy: 'Client Rep.', date: 'Jul 3, 2024', size: '0.3 MB', status: 'approved', tags: ['PAC', 'Handover'], description: 'Provisional Acceptance Certificate signed by SABIC client representative for Yanbu Industrial project.' },
]

const categories = ['All', 'Contract', 'Engineering', 'Drawings', 'Procurement', 'HSE', 'Finance', 'Testing']

const stageColors: Record<number, string> = {
  1: 'bg-secondary/60 text-foreground',
  2: 'bg-secondary/60 text-primary',
  3: 'bg-secondary/60 text-teal-400',
  4: 'bg-accent text-primary',
  5: 'bg-accent text-amber-400',
  6: 'bg-emerald-950/20 text-emerald-400',
  7: 'bg-purple-950/20 text-purple-400',
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  approved:     { label: 'Approved',     color: 'text-emerald-400',         bg: 'bg-emerald-950/20',    border: 'border-emerald-800/30' },
  pending:      { label: 'Pending',      color: 'text-amber-400',         bg: 'bg-accent',   border: 'border-amber-500/20' },
  'under-review': { label: 'Under Review', color: 'text-primary',       bg: 'bg-secondary/60',   border: 'border-primary/20' },
  draft:        { label: 'Draft',        color: 'text-muted-foreground',   bg: 'bg-muted',       border: 'border-border' },
  rejected:     { label: 'Rejected',     color: 'text-red-400',           bg: 'bg-red-950/20',      border: 'border-red-800/30' },
  superseded:   { label: 'Superseded',   color: 'text-muted-foreground',   bg: 'bg-muted',       border: 'border-border' },
}

const vStatusConfig: Record<string, { color: string; bg: string }> = {
  approved:   { color: 'text-emerald-400',       bg: 'bg-emerald-950/20' },
  pending:    { color: 'text-amber-400',       bg: 'bg-accent' },
  superseded: { color: 'text-muted-foreground', bg: 'bg-muted' },
}

export default function DocumentsPage() {
  const { pushActivity, pushNotification, projects } = useWorkspace()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Document | null>(null)
  const [detailTab, setDetailTab] = useState<'details' | 'history'>('details')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '', project: '', category: '', stage: '', version: '', description: '',
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filtered = documents.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = categoryFilter === 'All' || d.category === categoryFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  const handleSelectDoc = (doc: Document) => {
    setSelected(doc)
    setDetailTab('details')
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-foreground/50 hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Drawer */}
        {uploadOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/40" onClick={() => setUploadOpen(false)} />
            <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary">
                <div>
                  <p className="text-white font-semibold">Upload Document</p>
                  <p className="text-white/60 text-xs mt-0.5">Add a new document to the repository</p>
                </div>
                <button onClick={() => setUploadOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload zone */}
              <div className="p-6 space-y-5">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Drop file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, DWG — max 100 MB</p>
                  <button className="mt-3 text-xs text-primary font-semibold hover:underline">Select File</button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <UploadField label="Document Name *">
                    <input
                      className="upload-input"
                      placeholder="e.g. IFC Drawing Package — Civil"
                      value={uploadForm.name}
                      onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </UploadField>

                  <div className="grid grid-cols-2 gap-3">
                    <UploadField label="Project *">
                      <select
                        className="upload-input"
                        value={uploadForm.project}
                        onChange={e => setUploadForm(f => ({ ...f, project: e.target.value }))}
                      >
                        <option value="">Select project</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </UploadField>

                    <UploadField label="Category *">
                      <select
                        className="upload-input"
                        value={uploadForm.category}
                        onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                      >
                        <option value="">Select category</option>
                        <option>Contract</option>
                        <option>Engineering</option>
                        <option>Drawings</option>
                        <option>Procurement</option>
                        <option>HSE</option>
                        <option>Finance</option>
                        <option>Testing</option>
                      </select>
                    </UploadField>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <UploadField label="EPC Stage">
                      <select
                        className="upload-input"
                        value={uploadForm.stage}
                        onChange={e => setUploadForm(f => ({ ...f, stage: e.target.value }))}
                      >
                        <option value="">Select stage</option>
                        <option value="1">Stage 1 — Pre-Contract</option>
                        <option value="2">Stage 2 — Contract Setup</option>
                        <option value="3">Stage 3 — Engineering</option>
                        <option value="4">Stage 4 — Procurement</option>
                        <option value="5">Stage 5 — Construction</option>
                        <option value="6">Stage 6 — Finance</option>
                        <option value="7">Stage 7 — T&C Handover</option>
                      </select>
                    </UploadField>

                    <UploadField label="Version">
                      <input
                        className="upload-input font-mono"
                        placeholder="e.g. 1.0"
                        value={uploadForm.version}
                        onChange={e => setUploadForm(f => ({ ...f, version: e.target.value }))}
                      />
                    </UploadField>
                  </div>

                  <UploadField label="Description / Revision Comments">
                    <textarea
                      className="upload-input resize-none"
                      rows={3}
                      placeholder="Brief description of changes or document purpose..."
                      value={uploadForm.description}
                      onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </UploadField>
                </div>

                {/* Submit for approval option */}
                <div className="flex items-center gap-2 bg-secondary/60 border border-primary/20 rounded-lg px-4 py-3">
                  <input type="checkbox" id="submit-review" className="w-4 h-4 accent-primary" />
                  <label htmlFor="submit-review" className="text-xs text-primary font-medium">
                    Submit for approval immediately after upload
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setUploadOpen(false)}
                    className="flex-1 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const docName = uploadForm.name || 'New Document'
                      const proj = uploadForm.project || 'Portfolio'
                      setUploadOpen(false)
                      pushActivity({ actor: 'You', action: 'uploaded document', target: docName, tone: 'default' })
                      pushNotification({
                        title: `Document Uploaded: ${docName}`,
                        body: `A new document was uploaded to ${proj}${uploadForm.stage ? ` (${uploadForm.stage})` : ''} and is pending review.`,
                        category: 'documents',
                        link: '/documents',
                        urgent: false,
                        icon: FileText,
                        project: proj,
                      })
                      showToast(`Document "${docName}" uploaded successfully`)
                      setUploadForm({ name: '', project: '', category: '', stage: '', version: '', description: '' })
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                </div>
              </div>
            </div>

            <style jsx>{`
              .upload-input {
                width: 100%;
                border: 1px solid var(--border);
                border-radius: 0.5rem;
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
                background: var(--background);
                color: var(--foreground);
                outline: none;
                transition: border-color 0.15s;
              }
              .upload-input:focus { border-color: var(--ring); }
              select.upload-input { cursor: pointer; }
            `}</style>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Center</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Centralized document repository with version control and audit trail</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => showToast('New folder created')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Folder
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Documents" value={documents.length.toString()} subtitle="All projects" icon={FileText} accent="navy" />
          <KPICard title="Approved" value={documents.filter(d => d.status === 'approved').length.toString()} subtitle="Valid documents" icon={CheckCircle} accent="green" />
          <KPICard title="Pending Review" value={documents.filter(d => ['pending', 'under-review'].includes(d.status)).length.toString()} subtitle="Awaiting action" icon={Clock} accent="orange" />
          <KPICard title="Draft" value={documents.filter(d => d.status === 'draft').length.toString()} subtitle="Not submitted" icon={AlertTriangle} accent="indigo" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search documents, projects, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="under-review">Under Review</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  categoryFilter === cat
                    ? 'bg-secondary text-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {cat} {cat === 'All' ? `(${documents.length})` : `(${documents.filter(d => d.category === cat).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Document list + detail panel */}
        <div className="flex gap-6">
          <div className={`bg-card border border-border rounded-xl overflow-hidden ${selected ? 'hidden lg:block lg:flex-1' : 'flex-1'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Document', 'Project', 'Category', 'Stage', 'Version', 'Uploaded By', 'Date', 'Size', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(doc => {
                    const cfg = statusConfig[doc.status]
                    return (
                      <tr
                        key={doc.id}
                        className={`hover:bg-muted/20 transition-colors cursor-pointer ${selected?.id === doc.id ? 'bg-secondary/60/30' : ''}`}
                        onClick={() => handleSelectDoc(doc)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-3.5 h-3.5 text-foreground" />
                            </div>
                            <p className="text-xs font-medium text-foreground max-w-[180px] truncate">{doc.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{doc.project}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{doc.category}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${stageColors[doc.stage]}`}>S{doc.stage}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-bold text-foreground">v{doc.version}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{doc.uploadedBy}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{doc.date}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{doc.size}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); showToast(`Viewing ${doc.name}`) }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); showToast(`Downloading ${doc.name}`) }}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleSelectDoc(doc); setDetailTab('history') }}
                              className="text-muted-foreground hover:text-amber-400 transition-colors"
                              title="View version history"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-foreground">No documents found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-80 flex-shrink-0 bg-card border border-border rounded-xl overflow-hidden h-fit">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary">
                <p className="text-white font-semibold text-sm">Document Details</p>
                <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {([
                  { key: 'details', label: 'Details', icon: Info },
                  { key: 'history', label: `History (${(versionHistory[selected.id] || []).length})`, icon: History },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`flex items-center gap-1.5 flex-1 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                      detailTab === tab.key
                        ? 'border-amber-500 text-amber-400 bg-accent/30'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Details tab */}
              {detailTab === 'details' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{selected.name}</p>
                      <p className="text-xs text-muted-foreground">{selected.id}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Project', value: selected.project },
                      { label: 'Category', value: selected.category },
                      { label: 'Version', value: `v${selected.version}` },
                      { label: 'Stage', value: `Stage ${selected.stage}` },
                      { label: 'Uploaded By', value: selected.uploadedBy },
                      { label: 'Date', value: selected.date },
                      { label: 'File Size', value: selected.size },
                      { label: 'Status', value: statusConfig[selected.status].label },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                        <p className="text-xs font-medium text-foreground mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-secondary/60 text-primary px-2 py-0.5 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => showToast(`Viewing ${selected.name}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => showToast(`Downloading ${selected.name}`)}
                      className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground text-xs font-medium py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                  {['pending', 'under-review'].includes(selected.status) && (
                    <button
                      onClick={() => { showToast(`${selected.id} submitted for review`); setSelected(null) }}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      Submit for Approval
                    </button>
                  )}
                </div>
              )}

              {/* Version history tab */}
              {detailTab === 'history' && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-foreground">Version History</p>
                    <button
                      onClick={() => { setUploadOpen(true); setUploadForm(f => ({ ...f, name: selected.name, project: selected.project, category: selected.category })) }}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Revision
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(versionHistory[selected.id] || []).map((v, i) => {
                      const vc = vStatusConfig[v.status]
                      const isCurrent = i === 0
                      return (
                        <div key={v.version} className={`border rounded-xl p-3 ${isCurrent ? 'border-primary/30 bg-secondary/60/30' : 'border-border bg-muted/10'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-foreground">v{v.version}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold text-primary bg-secondary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${vc.color} ${vc.bg}`}>
                              {v.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{v.comment}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{v.uploadedBy} · {v.date} · {v.size}</span>
                            <button
                              onClick={() => showToast(`Downloading v${v.version}`)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function UploadField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}
