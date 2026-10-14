import { ShippingBillFormValues } from '@/shipping-bills/model'
import { useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'

const dateType = 'date' as 'text'

export interface LicenceItemProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  index: number
  onRemove: () => void
}

export function LicenceItem({ formCtx, index, onRemove }: LicenceItemProps) {
  const { register } = formCtx.hooks
  const basePath = `licenses.${index}` as const

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex justify-between">
        <h3 className="text-sm font-semibold">Licence {index + 1}</h3>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Registration number" {...register(`${basePath}.registrationNumber`)} />
        <Input
          label="Registration date"
          type={dateType}
          {...register(`${basePath}.registrationDate`)}
        />
        <Input
          label="Invoice serial number"
          type="number"
          {...register(`${basePath}.invoiceSerialNumber`)}
        />
        <Input
          label="Item serial number"
          type="number"
          {...register(`${basePath}.itemSerialNumber`)}
        />
        <Input
          label="Licence serial number"
          type="number"
          {...register(`${basePath}.licenseSerialNumber`)}
        />
        <Input label="Item serial, Part E" {...register(`${basePath}.itemSerialNumberPartE`)} />
        <Input label="Item serial, Part C" {...register(`${basePath}.itemSerialNumberPartC`)} />
        <Input
          label="Licence quantity"
          type="number"
          {...register(`${basePath}.licenseQuantity`)}
        />
        <Input
          label="Export quantity"
          type="number"
          {...register(`${basePath}.licenseExportQuantity`)}
        />
        <Select<ShippingBillFormValues>
          label="Goods source"
          name={`${basePath}.indigenousOrImported`}
          options={[
            { value: 'I', label: 'Imported' },
            { value: 'D', label: 'Indigenous' }
          ]}
          placeholder="Select if needed"
        />
      </div>
    </div>
  )
}
