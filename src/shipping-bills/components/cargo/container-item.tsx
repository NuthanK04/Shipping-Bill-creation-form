import { masterDataService } from '@/services/master-data.service'
import { ShippingBillFormValues } from '@/shipping-bills/model'
import { useEffect, useState } from 'react'
import { useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'

const dateType = 'date' as 'text'

export interface ContainerItemProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  index: number
  onRemove: () => void
}

export function ContainerItem({ formCtx, index, onRemove }: ContainerItemProps) {
  const { register } = formCtx.hooks
  const [containerSizes, setContainerSizes] = useState<{ value: string; label: string }[]>([])
  const [sealTypes, setSealTypes] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    let active = true
    void Promise.all([
      masterDataService.getContainerSizes(),
      masterDataService.getContainerSealTypes()
    ]).then(([sizes, seals]) => {
      if (active) {
        setContainerSizes(sizes)
        setSealTypes(seals)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const basePath = `containers.${index}` as const

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-gray-100 text-xs dark:bg-gray-800">
            📦
          </span>
          <h3 className="text-sm font-bold text-gray-950 dark:text-white">ISO Container {index + 1}</h3>
        </div>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Container number" {...register(`${basePath}.containerNumber`)} />
        <Select<ShippingBillFormValues>
          label="Size"
          name={`${basePath}.containerSize`}
          options={containerSizes}
          placeholder="Select size"
        />
        <Input label="Seal number" {...register(`${basePath}.exciseSealNumber`)} />
        <Input label="Seal date" type={dateType} {...register(`${basePath}.sealDate`)} />
        <Select<ShippingBillFormValues>
          label="Seal type"
          name={`${basePath}.sealType`}
          options={sealTypes}
          placeholder="Select if needed"
        />
        <Input label="Seal device ID" {...register(`${basePath}.sealDeviceId`)} />
        <Input
          label="Movement document type"
          {...register(`${basePath}.movementDocumentType`)}
        />
        <Input
          label="Movement document number"
          {...register(`${basePath}.movementDocumentNumber`)}
        />
      </div>
    </div>
  )
}
