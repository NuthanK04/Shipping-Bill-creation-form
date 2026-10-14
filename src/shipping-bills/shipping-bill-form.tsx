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
import { Branch, emptyBill, Exporter, Business, SavedBill, ShippingBillFormValues } from './model'
import { workflowSteps } from './workflow'
import { useForm } from 'core/form'
import { Form } from 'core/form/components'
import { navigate, useParams } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { Button } from 'ui/basic/button'
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
  const { setValue, formState, watch } = formCtx.hooks
  const { containers } = watch()

  const [activeTab, setActiveTab] = useState('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)
  const [isSaving, setIsSaving] = useState(false)
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranch | null>(null)

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
      toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created')
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            className="mb-2 text-sm text-gray-500 hover:underline"
            onClick={() => navigate(routes.dashboard)}>
            ← Shipping bills
          </button>
          <h1 className="text-2xl font-semibold text-gray-950">
            {bill ? `Edit shipping bill #${bill.id}` : 'New shipping bill'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the everyday details first. Open advanced sections only when needed.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {workflowSteps.map((step, index) => {
          const isShippingBill = step.id === 'shipping-bill'
          return (
            <div
              key={step.id}
              className={`rounded-lg border p-3 ${
                isShippingBill ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-gray-50'
              }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs">
                  {index + 1}
                </span>
                {step.title}
              </div>
              <p className="ml-8 text-xs text-gray-500">{step.description}</p>
            </div>
          )
        })}
      </div>

      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
          <TabsList className="flex w-full justify-start overflow-x-auto">
            <TabsTrigger value="details">1. Details</TabsTrigger>
            <TabsTrigger value="invoices">2. Invoices & goods</TabsTrigger>
            <TabsTrigger value="documents">3. Others</TabsTrigger>
          </TabsList>

          <PersistentTab value="details" activeTab={activeTab}>
            <ShipmentBasicsTab
              formCtx={formCtx}
              containersCount={containers?.length ?? 0}
              onQuickAdd={(kind, role) => setQuickAdd({ kind, role })}
              onAddBranch={(kind, ownerId, branchName) => setQuickBranch({ kind, ownerId, branchName })}
            />
          </PersistentTab>

          <PersistentTab value="invoices" activeTab={activeTab}>
            <InvoicesTab
              formCtx={formCtx}
              onQuickAdd={(role, invoiceIndex, itemIndex) =>
                setQuickAdd({ kind: 'business', role, invoiceIndex, itemIndex })
              }
              onAddBranch={(ownerId, branchName) => setQuickBranch({ kind: 'business', ownerId, branchName })}
            />
          </PersistentTab>

          <PersistentTab value="documents" activeTab={activeTab}>
            <DocumentsTab formCtx={formCtx} />
          </PersistentTab>
        </Tabs>

        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4">
          <Button variant="outline" type="button" onClick={() => navigate(routes.dashboard)}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {activeTab !== 'details' && (
              <Button
                variant="outline"
                type="button"
                onClick={async () => {
                  const current = formCtx.hooks.getValues()
                  const saved = await shippingBillService.save(current, draftId)
                  setDraftId(saved.id)
                  setActiveTab(activeTab === 'documents' ? 'invoices' : 'details')
                }}>
                Previous
              </Button>
            )}

            {activeTab !== 'documents' ? (
              <Button
                type="button"
                onClick={async (e) => {
                  e.preventDefault()
                  const current = formCtx.hooks.getValues()
                  const saved = await shippingBillService.save(current, draftId)
                  setDraftId(saved.id)
                  toast.success('Details saved')
                  setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
                }}>
                Save & Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            )}
          </div>
        </div>
      </Form>

      {quickAdd && (
        <PartyDialog
          key={`${quickAdd.kind}-${quickAdd.role ?? 'exporter'}-${quickAdd.invoiceIndex ?? 0}`}
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handleQuickSaved}
        />
      )}

      {quickBranch && (
        <BranchDialog
          key={`${quickBranch.kind}-${quickBranch.ownerId}`}
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={(branch: Branch) => setValue(quickBranch.branchName as any, String(branch.id), { shouldValidate: true })}
        />
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
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-gray-500">Loading shipping bill...</p>
      </div>
    )
  }

  if (id && !bill) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Shipping bill not found</h1>
        <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
      </div>
    )
  }

  return <BillEditor key={id ?? 'new'} bill={bill} />
}
