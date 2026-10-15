import { masterDataService, SchemeInfo } from '@/services/master-data.service'
import { BillItemForm, lineTotal, ShippingBillFormValues } from '@/shipping-bills/model'
import { useEffect, useState } from 'react'
import { useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { AdvancedSection } from '../common/advanced-section'
import { BranchPath, PartyPicker } from '../common/party-picker'

const dateType = 'date' as 'text'

export interface GoodsItemEditorProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  invoiceIndex: number
  itemIndex: number
  item: BillItemForm
  currency: string
  canRemove: boolean
  onRemove: () => void
  onDuplicate?: () => void
  onQuickAdd: (role: 'itemThirdParty', invoiceIndex: number, itemIndex: number) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
}

export function GoodsItemEditor({
  formCtx,
  invoiceIndex,
  itemIndex,
  item,
  currency,
  canRemove,
  onRemove,
  onDuplicate,
  onQuickAdd,
  onAddBranch
}: GoodsItemEditorProps) {
  const { register } = formCtx.hooks
  const [schemeOptions, setSchemeOptions] = useState<{ value: string; label: string }[]>([])
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([])
  const [tradeOptions, setTradeOptions] = useState<{ value: string; label: string }[]>([])
  const [schemes, setSchemes] = useState<SchemeInfo[]>([])

  // Async load master options
  useEffect(() => {
    let active = true
    void Promise.all([
      masterDataService.getSchemeCodes(),
      masterDataService.getQuantityCodes(),
      masterDataService.getTradeAgreements()
    ]).then(([schemeList, uomList, tradesList]) => {
      if (active) {
        setSchemes(schemeList)
        setSchemeOptions(schemeList.map((s) => ({ value: s.value, label: s.label })))
        setUnitOptions(uomList)
        setTradeOptions(tradesList)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const selectedScheme = schemes.find((s) => s.value === item.schemeCode)
  const showDrawback =
    selectedScheme &&
    (selectedScheme.drawback === true || selectedScheme.RODTEP === true || selectedScheme.ROSCTL === true)

  const basePath = `invoices.${invoiceIndex}.items.${itemIndex}` as const

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-950 dark:text-white">Item {itemIndex + 1}</h4>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {currency || 'USD'} {lineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onDuplicate && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onDuplicate}>
              Duplicate
            </Button>
          )}
          {canRemove && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          label="RITC / HS code"
          {...register(`${basePath}.ritcCode`)}
          placeholder="e.g. 61091000"
        />
        <Select<ShippingBillFormValues>
          label="Scheme code"
          name={`${basePath}.schemeCode`}
          options={schemeOptions}
          placeholder="Select scheme"
        />
        <Input
          label="Goods description"
          {...register(`${basePath}.goodsDescription1`)}
          wrapClass="lg:col-span-4"
          placeholder="e.g. Cotton T-shirts"
        />
        <Input
          label="Quantity"
          type="number"
          {...register(`${basePath}.quantity`)}
        />
        <Select<ShippingBillFormValues>
          label="Unit"
          name={`${basePath}.unitOfMeasurement`}
          options={unitOptions}
          rules={{ required: true }}
        />
        <Input
          label={`Unit price (${currency || 'currency'})`}
          type="number"
          {...register(`${basePath}.unitPrice`)}
        />
        <Input
          label="Item Total"
          type="number"
          placeholder={`${currency} ${lineTotal(item).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          {...register(`${basePath}.lineTotal`)}
        />
        <Select<ShippingBillFormValues>
          label="IGST payment"
          name={`${basePath}.igstPaymentStatus`}
          options={[
            { value: 'NA', label: 'Not applicable' },
            { value: 'LUT', label: 'Under LUT / bond' },
            { value: 'P', label: 'Against payment' }
          ]}
          placeholder="Select if applicable"
        />
      </div>

      {/* Row 3: drawback inputs (conditional) + checkboxes */}
      <div className="mb-3 flex flex-wrap items-end gap-4">
        {showDrawback && (
          <>
            <div className="w-36">
              <Input
                label="Drawback Serial no."
                {...register(`${basePath}.drawbackSerialNumber`)}
              />
            </div>
            <div className="w-32">
              <Input
                label="Drawback Unit"
                {...register(`${basePath}.drawbackUnit`)}
              />
            </div>
            <div className="w-36">
              <Input
                label="Drawback Quantity"
                type="number"
                {...register(`${basePath}.drawbackQuantity`)}
              />
            </div>
          </>
        )}
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(`${basePath}.rewardItem`)} />
          Claim reward
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(`${basePath}.thirdPartyItem`)} />
          Third-party item
        </label>
      </div>

      {item.thirdPartyItem && (
        <div className="my-4">
          <PartyPicker
            formCtx={formCtx}
            ownerName={`${basePath}.itemThirdPartyId`}
            branchName={`${basePath}.itemThirdPartyBranchId`}
            label="Item third party"
            kind="business"
            required={false}
            onQuickAdd={() => onQuickAdd('itemThirdParty', invoiceIndex, itemIndex)}
            onAddBranch={(ownerId) =>
              onAddBranch(ownerId, `${basePath}.itemThirdPartyBranchId`)
            }
          />
        </div>
      )}

      <AdvancedSection title="Item customs, taxes and incentives">
        <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Unit of rate"
            {...register(`${basePath}.unitOfRate`)}
            options={unitOptions}
            placeholder={item.unitOfMeasurement || 'PCS'}
          />
          <Input
            label="Per Unit (Rate)"
            type="number"
            placeholder="1"
            {...register(`${basePath}.numberOfUnits`)}
          />
          <Input
            label="Present market value"
            type="number"
            {...register(`${basePath}.presentMarketValue`)}
          />
          <Input label="GCess" type="number" {...register(`${basePath}.cess`)} />
          <Input
            label="Accessories description"
            wrapClass="lg:col-span-3"
            {...register(`${basePath}.accessoriesDescription`)}
          />
          <Select<ShippingBillFormValues>
            label="Accessory status"
            name={`${basePath}.accessoryStatus`}
            options={[
              { value: '0', label: 'No accessory' },
              { value: '1', label: 'Included free of cost' },
              { value: '2', label: 'Entered separately' }
            ]}
            placeholder="Select if relevant"
          />
          {item.igstPaymentStatus === 'P' && (
            <>
              <Input
                label="Taxable value"
                type="number"
                {...register(`${basePath}.taxableValue`)}
              />
              <Input
                label="IGST amount"
                type="number"
                {...register(`${basePath}.igstAmount`)}
              />
            </>
          )}

          <Input
            label="Origin district code"
            {...register(`${basePath}.originDistrictCode`)}
          />
          <Select<ShippingBillFormValues>
            label="Trade agreement code"
            name={`${basePath}.tradeAgreementsCode`}
            options={tradeOptions}
            placeholder="NCPTI"
          />
          <Input label="End use code" {...register(`${basePath}.endUseOfItem`)} />
          <Input
            label="Packages for item"
            type="number"
            {...register(`${basePath}.totalPackage`)}
          />
        </div>

        <AdvancedSection title="AR4 / excise details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="AR4 number" {...register(`${basePath}.ar4Number`)} />
            <Input
              label="AR4 date"
              type={dateType}
              {...register(`${basePath}.ar4Date`)}
            />
          </div>
        </AdvancedSection>
      </AdvancedSection>
    </div>
  )
}
