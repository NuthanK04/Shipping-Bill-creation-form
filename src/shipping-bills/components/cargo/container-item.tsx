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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex justify-between">
        <h3 className="text-sm font-semibold">Container {index + 1}</h3>
        <Button size="sm" variant="ghost" onClick={onRemove}>
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
