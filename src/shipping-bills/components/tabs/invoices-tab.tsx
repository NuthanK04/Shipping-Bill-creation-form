import { emptyInvoice, ShippingBillFormValues } from '@/shipping-bills/model'
import { useFieldArray, useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { BranchPath } from '../common/party-picker'
import { InvoiceEditor } from '../invoices/invoice-editor'

export interface InvoicesTabProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  onQuickAdd: (
    role: 'buyer' | 'thirdParty' | 'itemThirdParty',
    invoiceIndex: number,
    itemIndex?: number
  ) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
}

export function InvoicesTab({ formCtx, onQuickAdd, onAddBranch }: InvoicesTabProps) {
  const { control, watch } = formCtx.hooks
  const values = watch()
  const {
    fields: invoices,
    append: addInvoice,
    remove: removeInvoice
  } = useFieldArray({ control, name: 'invoices' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Invoices & goods</h2>
          <p className="text-sm text-gray-500">One invoice and one item are ready to fill in.</p>
        </div>
        <Button variant="outline" onClick={() => addInvoice(emptyInvoice())}>
          + Add invoice
        </Button>
      </div>

      {invoices.map((field, index) => (
        <InvoiceEditor
          key={field.id}
          formCtx={formCtx}
          index={index}
          invoice={values.invoices[index] ?? emptyInvoice()}
          canRemove={invoices.length > 1}
          onRemove={() => removeInvoice(index)}
          onQuickAdd={onQuickAdd}
          onAddBranch={onAddBranch}
        />
      ))}
    </div>
  )
}
