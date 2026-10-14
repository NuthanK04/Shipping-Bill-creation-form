import { masterDataService } from '@/services/master-data.service'
import { BillInvoiceForm, emptyItem, invoiceTotal, ShippingBillFormValues } from '@/shipping-bills/model'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { BranchPath, PartyPicker } from '../common/party-picker'
import { SectionHeading } from '../common/section-heading'
import { GoodsItemEditor } from './goods-item-editor'

const dateType = 'date' as 'text'

export interface InvoiceEditorProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  index: number
  invoice: BillInvoiceForm
  canRemove: boolean
  onRemove: () => void
  onQuickAdd: (
    role: 'buyer' | 'thirdParty' | 'itemThirdParty',
    invoiceIndex: number,
    itemIndex?: number
  ) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
}

export function InvoiceEditor({
  formCtx,
  index,
  invoice,
  canRemove,
  onRemove,
  onQuickAdd,
  onAddBranch
}: InvoiceEditorProps) {
  const { register, control, watch } = formCtx.hooks
  const invoiceValues = watch(`invoices.${index}`)
  const {
    fields: items,
    append: addItem,
    remove: removeItem
  } = useFieldArray({ control, name: `invoices.${index}.items` })

  const buyerSame = watch(`invoices.${index}.buyerSameAsConsignee`)

  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([])
  const [contractTypes, setContractTypes] = useState<{ value: string; label: string }[]>([])
  const [priceInclusions, setPriceInclusions] = useState<{ value: string; label: string }[]>([])
  const [paymentTypes, setPaymentTypes] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    let active = true
    void Promise.all([
      masterDataService.getCurrencies(),
      masterDataService.getContractTypes(),
      masterDataService.getPriceInclusionTypes(),
      masterDataService.getPaymentTypes()
    ]).then(([currList, contractList, inclusionList, paymentList]) => {
      if (active) {
        setCurrencies(currList)
        setContractTypes(contractList)
        setPriceInclusions(inclusionList)
        setPaymentTypes(paymentList)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const basePath = `invoices.${index}` as const

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Invoice {index + 1}</h3>
        </div>
        {canRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Invoice number" {...register(`${basePath}.invoiceNumber`)} />
          <Input label="Invoice date" type={dateType} {...register(`${basePath}.invoiceDate`)} />
          <div className="flex gap-2">
            <div className="w-[100px] shrink-0">
              <Select<ShippingBillFormValues>
                label="Currency"
                name={`${basePath}.currency`}
                options={currencies}
                rules={{ required: true }}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Total"
                type="number"
                min={0}
                {...register(`${basePath}.invoiceTotal`)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Select<ShippingBillFormValues>
            label="Contract"
            name={`${basePath}.contractType`}
            options={contractTypes}
            rules={{ required: true }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register(`${basePath}.buyerSameAsConsignee`)} />
          Buyer & consignee are same
        </label>

        {!buyerSame && (
          <PartyPicker
            formCtx={formCtx}
            ownerName={`${basePath}.buyerId`}
            branchName={`${basePath}.buyerBranchId`}
            label="Buyer"
            kind="business"
            onQuickAdd={() => onQuickAdd('buyer', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `${basePath}.buyerBranchId`)}
          />
        )}

        <div className="space-y-4">
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {/* Row 1: Freight & Insurance */}
            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Freight</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`${basePath}.freightRate`)}
                      className="text-right"
                      disabled={invoiceValues.freightAmount !== '' && invoiceValues.freightAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`${basePath}.freightAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.freightRate !== '' && invoiceValues.freightRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`${basePath}.freightCurrency`}
                    options={currencies}
                    placeholder={invoice.currency}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Insurance</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`${basePath}.insuranceRate`)}
                      className="text-right"
                      disabled={invoiceValues.insuranceAmount !== '' && invoiceValues.insuranceAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`${basePath}.insuranceAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.insuranceRate !== '' && invoiceValues.insuranceRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`${basePath}.insuranceCurrency`}
                    options={currencies}
                    placeholder={invoice.currency}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Commission & Discount */}
            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Commission</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`${basePath}.commissionRate`)}
                      className="text-right"
                      disabled={invoiceValues.commissionAmount !== '' && invoiceValues.commissionAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`${basePath}.commissionAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.commissionRate !== '' && invoiceValues.commissionRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`${basePath}.commissionCurrency`}
                    options={currencies}
                    placeholder={invoice.currency}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Discount</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`${basePath}.discountRate`)}
                      className="text-right"
                      disabled={invoiceValues.discountAmount !== '' && invoiceValues.discountAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`${basePath}.discountAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.discountRate !== '' && invoiceValues.discountRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`${basePath}.discountCurrency`}
                    options={currencies}
                    placeholder={invoice.currency}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Other Deductions & Packing */}
            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Other Deductions</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`${basePath}.otherDeductionsRate`)}
                      className="text-right"
                      disabled={
                        invoiceValues.otherDeductionsAmount !== '' && invoiceValues.otherDeductionsAmount != null
                      }
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`${basePath}.otherDeductionsAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.otherDeductionsRate !== '' && invoiceValues.otherDeductionsRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`${basePath}.otherDeductionsCurrency`}
                    options={currencies}
                    placeholder={invoice.currency}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Packing Charges</span>
                  <Input
                    type="number"
                    {...register(`${basePath}.packingCharges`)}
                    className="py-1 text-right"
                    placeholder="Amount"
                  />
                  <span className="w-14 text-sm text-gray-500">—</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Price includes"
              name={`${basePath}.freightInsuranceIncluded`}
              options={priceInclusions}
              placeholder="Select if applicable"
            />
            <Input label="Contract / order number" {...register(`${basePath}.contractNumber`)} />
            <Select<ShippingBillFormValues>
              label="Payment type"
              name={`${basePath}.natureOfPayment`}
              options={paymentTypes}
              placeholder="Select if applicable"
            />
            <Input
              label="Payment period (days)"
              type="number"
              {...register(`${basePath}.periodOfPayment`)}
            />
          </div>

          <PartyPicker
            formCtx={formCtx}
            ownerName={`${basePath}.thirdPartyId`}
            branchName={`${basePath}.thirdPartyBranchId`}
            label="Third party (optional)"
            kind="business"
            required={false}
            onQuickAdd={() => onQuickAdd('thirdParty', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `${basePath}.thirdPartyBranchId`)}
          />
        </div>

        {/* Goods items */}
        <div className="border-t border-gray-200 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionHeading title="Goods" />
            <Button size="sm" variant="outline" onClick={() => addItem(emptyItem())}>
              + Add item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((field, itemIndex) => {
              const item = invoice.items[itemIndex] ?? emptyItem()
              return (
                <GoodsItemEditor
                  key={field.id}
                  formCtx={formCtx}
                  invoiceIndex={index}
                  itemIndex={itemIndex}
                  item={item}
                  currency={invoice.currency}
                  canRemove={items.length > 1}
                  onRemove={() => removeItem(itemIndex)}
                  onQuickAdd={onQuickAdd}
                  onAddBranch={onAddBranch}
                />
              )
            })}
          </div>
        </div>

        <div className="text-right text-sm font-semibold">
          Invoice total: {invoice.currency}{' '}
          {invoiceTotal(invoice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  )
}
