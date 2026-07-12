import { loadFinancialModel } from '@/app/actions/financial-models'
import { listModelActuals } from '@/app/actions/model-actuals'
import { ModelWorkspace } from '@/components/finance/model-workspace'

export const dynamic = 'force-dynamic'

export default async function FinancialModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const persisted = await loadFinancialModel(id)
  const actuals = persisted ? await listModelActuals(id) : []
  return (
    <ModelWorkspace
      modelId={id}
      initialTemplate={id.includes('epc') || id.startsWith('project-') ? 'epc' : 'solar-ipp'}
      persistedModel={persisted?.version.assumptions}
      persistedStatus={persisted?.model.status}
      persistedVersion={persisted?.model.currentVersion}
      persistedActuals={actuals}
      isPersisted={!!persisted}
    />
  )
}
