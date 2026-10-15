import { ShippingBillFormValues } from '@/shipping-bills/model'
import { useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Input } from 'ui/inputs/input'

export interface PackingRangeItemProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  index: number
  onRemove: () => void
}

export function PackingRangeItem({ formCtx, index, onRemove }: PackingRangeItemProps) {
  const { register } = formCtx.hooks
  const basePath = `packingRanges.${index}` as const

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-950 dark:text-white">Carton Range {index + 1}</span>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Package from"
          type="number"
          {...register(`${basePath}.packingNumberFrom`)}
        />
        <Input
          label="Package to"
          type="number"
          {...register(`${basePath}.packingNumberTo`)}
        />
        <Input label="Packing code" {...register(`${basePath}.packingCode`)} />
      </div>
    </div>
  )
}
