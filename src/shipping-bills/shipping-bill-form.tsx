import { shippingBillService } from '@/services/shipping-bill.service'
import { routes } from '@/shared/route-paths'
import { BranchDialog, PartyDialog } from './party-dialogs'
import { billSchema } from './schema/bill.schema'
import { BranchPath } from './components/common/party-picker'
import { PersistentTab } from './components/common/persistent-tab'
import { DocumentsTab } from './components/tabs/documents-tab'
import { InvoicesTab } from './components/tabs/invoices-tab'
import { ShipmentBasicsTab } from './components/tabs/shipment-basics-tab'
import { useDemoData } from './demo-store'
import { Branch, emptyBill, Exporter, Business, invoiceTotal, SavedBill, ShippingBillFormValues } from './model'
import { generateFlatFileContent } from './shipping-bill-service'
import { workflowSteps } from './workflow'
import { useForm } from 'core/form'
import { Form } from 'core/form/components'
import { navigate, useParams } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Dialog, DialogContent } from 'ui/interactive/dialog'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'

interface QuickAdd {
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty' | 'itemThirdParty'
  invoiceIndex?: number
  itemIndex?: number
}

interface QuickBranch {
  kind: 'exporter' | 'business'
  ownerId: number
  branchName: BranchPath
}

function BillEditor({ bill }: { bill?: SavedBill }) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, {
    defaultValues: bill?.values ?? emptyBill()
  })
  const { setValue, formState, watch, getValues } = formCtx.hooks
  const formValues = watch()
  const { containers, invoices } = formValues

  const [activeTab, setActiveTab] = useState('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)
  const [isSaving, setIsSaving] = useState(false)
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranch | null>(null)
  const [showEdiPreview, setShowEdiPreview] = useState(false)
  const [ediContent, setEdiContent] = useState('')

  // Calculate live values
  const grandTotal = (invoices || []).reduce((sum, inv) => sum + invoiceTotal(inv), 0)
  const totalItemsCount = (invoices || []).reduce((sum, inv) => sum + (inv.items?.length || 0), 0)
  const mainCurrency = invoices?.[0]?.currency || 'USD'

  // Navigate to appropriate tab when submission has validation errors
  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    toast.error('Please check the required fields')

    if (
      [
        'jobDate',
        'exporterId',
        'exporterBranchId',
        'consigneeId',
        'consigneeBranchId',
        'loadingPort',
        'finalDestinationPort'
      ].some((field) => field in formState.errors)
    ) {
      setActiveTab('details')
    } else if (formState.errors.invoices) {
      setActiveTab('invoices')
    } else if (
      formState.errors.containers ||
      formState.errors.packingRanges ||
      formState.errors.documents ||
      formState.errors.licenses
    ) {
      setActiveTab('documents')
    }
  }, [formState.submitCount, formState.errors])

  async function handleSave(data: ShippingBillFormValues) {
    try {
      setIsSaving(true)
      const saved = await shippingBillService.save(data, draftId)
      setDraftId(saved.id)
      toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created & validated')
      navigate(routes.toShippingBillEdit(saved.id))
    } catch (err: any) {
      console.error('Error saving shipping bill:', err)
      toast.error('Failed to save shipping bill')
    } finally {
      setIsSaving(false)
    }
  }

  function handleQuickSaved(party: Exporter | Business) {
    const branchId = party.branches[0]?.id
    if (!quickAdd || !branchId) return

    if (quickAdd.kind === 'exporter') {
      setValue('exporterId', String(party.id), { shouldValidate: true })
      setValue('exporterBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'consignee') {
      setValue('consigneeId', String(party.id), { shouldValidate: true })
      setValue('consigneeBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'itemThirdParty' && quickAdd.invoiceIndex != null && quickAdd.itemIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyId`, String(party.id), {
        shouldValidate: true
      })
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyBranchId`,
        String(branchId),
        { shouldValidate: true }
      )
    } else if (quickAdd.invoiceIndex != null) {
      const field = quickAdd.role === 'buyer' ? 'buyer' : 'thirdParty'
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}Id`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}BranchId`, String(branchId), { shouldValidate: true })
    }
  }

  const handleOpenEdiPreview = () => {
    const currentValues = getValues()
    const syntheticBill: SavedBill = {
      id: draftId || 1000,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      values: currentValues
    }
    const flat = generateFlatFileContent(syntheticBill)
    setEdiContent(flat)
    setShowEdiPreview(true)
  }

  const handleCopyEdi = () => {
    void navigator.clipboard.writeText(ediContent)
    toast.success('ICEGATE flat file (.sb) copied to clipboard')
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-800">
        <div>
          <button
            type="button"
            className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            onClick={() => navigate(routes.dashboard)}>
            <span>←</span> Back to Shipping bills
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              {bill ? `Shipping Bill #${bill.values.jobNumber || bill.id}` : 'New Shipping Bill Declaration'}
            </h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              EDI 1.0 (SB)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Official Indian Customs Declaration pursuant to the Customs Act, 1962 & DGFT Foreign Trade Policy.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenEdiPreview}
            className="h-8 gap-1.5 rounded-lg border-gray-300 bg-white text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Inspect ICEGATE EDI (.sb)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(routes.dashboard)}
            className="h-8 rounded-lg border-gray-300 text-xs dark:border-gray-700">
            Close
          </Button>
        </div>
      </div>

      {/* Modern Workflow Step Indicators */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {workflowSteps.map((step, index) => {
          const isShippingBill = step.id === 'shipping-bill'
          return (
            <div
              key={step.id}
              className={`relative rounded-xl border p-3.5 transition-all ${
                isShippingBill
                  ? 'border-gray-950 bg-white shadow-xs ring-1 ring-gray-950/10 dark:border-white dark:bg-gray-900 dark:ring-white/20'
                  : 'border-gray-200 bg-white/70 dark:border-gray-800 dark:bg-gray-900/40'
              }`}>
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isShippingBill
                      ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  {index + 1}
                </span>
                <span className={isShippingBill ? 'text-gray-950 dark:text-white' : 'text-gray-600 dark:text-gray-400'}>
                  {step.title}
                </span>
                {isShippingBill && (
                  <span className="ml-auto inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <p className="mt-1 ml-7 text-[11px] text-gray-400 dark:text-gray-500">{step.description}</p>
            </div>
          )
        })}
      </div>

      {/* Main Form Body */}
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
          {/* Segmented Tab Navigation Bar */}
          <TabsList className="flex w-full justify-start gap-1 rounded-xl border border-gray-200 bg-gray-100/70 p-1.5 overflow-x-auto dark:border-gray-800 dark:bg-gray-900">
            <TabsTrigger
              value="details"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'details'
                  ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'
              }`}>
              <span>1. Shipment Basics</span>
              {formValues.exporterId && formValues.loadingPort && (
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="invoices"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'invoices'
                  ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'
              }`}>
              <span>2. Invoices & Goods</span>
              <span className="rounded-full bg-gray-200/80 px-1.5 py-0.2 text-[10px] text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {invoices?.length || 1}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="documents"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'documents'
                  ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'
              }`}>
              <span>3. Logistics & e-Sanchit</span>
              {containers && containers.length > 0 && (
                <span className="rounded-full bg-gray-200/80 px-1.5 py-0.2 text-[10px] text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {containers.length} Ctn
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1 Content */}
          <PersistentTab value="details" activeTab={activeTab}>
            <ShipmentBasicsTab
              formCtx={formCtx}
              containersCount={containers?.length ?? 0}
              onQuickAdd={(kind, role) => setQuickAdd({ kind, role })}
              onAddBranch={(kind, ownerId, branchName) => setQuickBranch({ kind, ownerId, branchName })}
            />
          </PersistentTab>

          {/* Tab 2 Content */}
          <PersistentTab value="invoices" activeTab={activeTab}>
            <InvoicesTab
              formCtx={formCtx}
              onQuickAdd={(role, invoiceIndex, itemIndex) =>
                setQuickAdd({ kind: 'business', role, invoiceIndex, itemIndex })
              }
              onAddBranch={(ownerId, branchName) => setQuickBranch({ kind: 'business', ownerId, branchName })}
            />
          </PersistentTab>

          {/* Tab 3 Content */}
          <PersistentTab value="documents" activeTab={activeTab}>
            <DocumentsTab formCtx={formCtx} />
          </PersistentTab>
        </Tabs>

        {/* Live Interactive Floating Sticky Action Bar */}
        <div className="sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
          {/* Real-time Summary Indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formValues.jobNumber ? `#${formValues.jobNumber}` : 'Draft Bill'}
              </span>
            </div>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="hidden text-gray-600 sm:inline dark:text-gray-400">
              Route: {formValues.loadingPort || '—'} → {formValues.finalDestinationPort || '—'}
            </span>
            <span className="hidden text-gray-300 sm:inline dark:text-gray-700">|</span>
            <span className="font-semibold text-gray-950 dark:text-white">
              {mainCurrency} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
            </span>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={() => navigate(routes.dashboard)}
              className="h-8 rounded-lg border-gray-300 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              Cancel
            </Button>

            {activeTab !== 'details' && (
              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={async () => {
                  const current = formCtx.hooks.getValues()
                  const saved = await shippingBillService.save(current, draftId)
                  setDraftId(saved.id)
                  setActiveTab(activeTab === 'documents' ? 'invoices' : 'details')
                }}
                className="h-8 rounded-lg border-gray-300 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                ← Previous
              </Button>
            )}

            {activeTab !== 'documents' ? (
              <Button
                type="button"
                size="sm"
                onClick={async (e) => {
                  e.preventDefault()
                  const current = formCtx.hooks.getValues()
                  const saved = await shippingBillService.save(current, draftId)
                  setDraftId(saved.id)
                  toast.success('Step saved locally')
                  setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
                }}
                className="h-8 rounded-lg bg-gray-950 px-4 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100">
                Save & Next →
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="h-8 rounded-lg bg-gray-950 px-4 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100">
                {isSaving ? 'Submitting...' : 'Validate & Save Bill ✓'}
              </Button>
            )}
          </div>
        </div>
      </Form>

      {/* Interactive Quick Add Party Dialog */}
      {quickAdd && (
        <PartyDialog
          key={`${quickAdd.kind}-${quickAdd.role ?? 'exporter'}-${quickAdd.invoiceIndex ?? 0}`}
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handleQuickSaved}
        />
      )}

      {/* Interactive Quick Add Branch Dialog */}
      {quickBranch && (
        <BranchDialog
          key={`${quickBranch.kind}-${quickBranch.ownerId}`}
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={(branch: Branch) => setValue(quickBranch.branchName as any, String(branch.id), { shouldValidate: true })}
        />
      )}

      {/* Realistic ICEGATE EDI Flat File Real-Time Modal Inspector */}
      {showEdiPreview && (
        <Dialog open={true} setOpen={setShowEdiPreview}>
          <DialogContent className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Electronic Data Interchange (EDI) Viewer
                </span>
                <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                  ICEGATE Shipping Bill Flat File (.sb)
                </h2>
                <p className="text-xs text-gray-500">
                  Exact standard flat file stream transmitted to ICEGATE customs servers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEdiPreview(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800">
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="relative rounded-xl border border-gray-200 bg-gray-950 p-4 font-mono text-xs text-emerald-400 shadow-inner dark:border-gray-800">
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap select-all font-mono text-[11px] leading-relaxed">
                  {ediContent}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={handleCopyEdi} className="text-xs gap-1.5">
                📋 Copy EDI Content
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEdiPreview(false)} className="text-xs">
                  Done
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const currentValues = getValues()
                    const billData: SavedBill = {
                      id: draftId || 1000,
                      created: '',
                      updated: '',
                      values: currentValues
                    }
                    await shippingBillService.downloadFlatFile(draftId || 1000, billData)
                    setShowEdiPreview(false)
                  }}
                  className="bg-gray-950 text-xs font-semibold text-white dark:bg-white dark:text-gray-950">
                  Download .sb File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const { bills } = useDemoData()
  const [bill, setBill] = useState<SavedBill | undefined>(() =>
    id ? bills.find((item) => item.id === Number(id)) : undefined
  )
  const [loading, setLoading] = useState(Boolean(id && !bill))

  useEffect(() => {
    let active = true
    if (id && !bill) {
      setLoading(true)
      void shippingBillService.getById(id).then((found) => {
        if (active) {
          setBill(found)
          setLoading(false)
        }
      })
    }
    return () => {
      active = false
    }
  }, [id, bill])

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="size-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white" />
        <p className="text-xs font-medium text-gray-500">Loading ICEGATE shipping bill declaration...</p>
      </div>
    )
  }

  if (id && !bill) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-bold text-gray-950 dark:text-white">Shipping Bill Not Found</h1>
        <p className="mt-1 text-xs text-gray-500">
          The requested declaration record #{id} was not found in the local repository or ICEGATE registry.
        </p>
        <Button size="sm" className="mt-4 text-xs" onClick={() => navigate(routes.dashboard)}>
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return <BillEditor key={id ?? 'new'} bill={bill} />
}
