import { masterDataService } from '@/services/master-data.service'
import { partyService } from '@/services/party.service'
import { portCountry, ShippingBillFormValues } from '@/shipping-bills/model'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'core/form'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { AdvancedSection } from '../common/advanced-section'
import { AsyncCombobox } from '../common/async-combobox'
import { BranchPath, PartyPicker } from '../common/party-picker'
import { SectionHeading } from '../common/section-heading'

const dateType = 'date' as 'text'

export interface ShipmentBasicsTabProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  containersCount: number
  onQuickAdd: (kind: 'exporter' | 'business', role?: 'consignee') => void
  onAddBranch: (kind: 'exporter' | 'business', ownerId: number, branchName: BranchPath) => void
}

export function ShipmentBasicsTab({
  formCtx,
  containersCount,
  onQuickAdd,
  onAddBranch
}: ShipmentBasicsTabProps) {
  const { register, setValue, watch } = formCtx.hooks
  const values = watch()

  const [destinationPorts, setDestinationPorts] = useState<{ value: string; label: string }[]>([])
  const [stateOptions, setStateOptions] = useState<{ value: string | number; label: string }[]>([])
  const [cargoOptions, setCargoOptions] = useState<{ value: string; label: string }[]>([])
  const [weightUnits, setWeightUnits] = useState<{ value: string; label: string }[]>([])
  const [sealTypes, setSealTypes] = useState<{ value: string; label: string }[]>([])
  const [nfeiCategories, setNfeiCategories] = useState<{ value: string; label: string }[]>([])

  const [marksOptions, setMarksOptions] = useState<{ value: string; label: string }[]>([])
  const [marksLoading, setMarksLoading] = useState(false)
  const previousExporterId = useRef(values.exporterId)

  // Async load dropdown options
  useEffect(() => {
    let active = true
    void Promise.all([
      masterDataService.searchDestinationPorts(''),
      masterDataService.getStates(),
      masterDataService.getCargoOptions(),
      masterDataService.getWeightUnits(),
      masterDataService.getSealTypes(),
      masterDataService.getNfeiCategories()
    ]).then(([ports, states, cargo, units, seals, nfei]) => {
      if (active) {
        setDestinationPorts(ports.map((p) => ({ value: p.value, label: p.label })))
        setStateOptions(states)
        setCargoOptions(cargo)
        setWeightUnits(units)
        setSealTypes(seals)
        setNfeiCategories(nfei)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Marks and numbers dynamic loader
  useEffect(() => {
    const exporterId = values.exporterId
    if (previousExporterId.current !== exporterId) {
      previousExporterId.current = exporterId
      setValue('marksAndNumbers', '', { shouldValidate: true })
    }

    let cancelled = false
    setMarksOptions([])
    setMarksLoading(Boolean(exporterId))

    if (exporterId) {
      void partyService
        .getMarksAndNumbers(exporterId)
        .then((options) => {
          if (cancelled) return
          setMarksOptions(options)
          setMarksLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setMarksOptions([])
          setMarksLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [setValue, values.exporterId])

  return (
    <Card>
      <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
      <CardContent className="space-y-5">
        <PartyPicker
          formCtx={formCtx}
          ownerName="exporterId"
          branchName="exporterBranchId"
          label="Exporter"
          kind="exporter"
          onQuickAdd={() => onQuickAdd('exporter')}
          onAddBranch={(ownerId) => onAddBranch('exporter', ownerId, 'exporterBranchId')}
        />

        <PartyPicker
          formCtx={formCtx}
          ownerName="consigneeId"
          branchName="consigneeBranchId"
          label="Consignee"
          kind="business"
          onQuickAdd={() => onQuickAdd('business', 'consignee')}
          onAddBranch={(ownerId) => onAddBranch('business', ownerId, 'consigneeBranchId')}
        />

        <div className="border-t border-gray-200 pt-5">
          <SectionHeading title="Route" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium">Port of loading</span>
              <AsyncCombobox
                name="loadingPort"
                placeholder="Select Indian port"
                rules={{ required: true }}
                fetchOptions={(query) => masterDataService.searchLoadingPorts(query)}
                getInitialLabel={async (code) => {
                  const port = await masterDataService.getPortByCode(code)
                  return port ? `${port.name} · ${port.code}` : code
                }}
              />
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium">Final destination port</span>
              <AsyncCombobox
                name="finalDestinationPort"
                placeholder="Select destination"
                rules={{ required: true }}
                fetchOptions={(query) => masterDataService.searchDestinationPorts(query)}
                getInitialLabel={async (code) => {
                  const port = await masterDataService.getPortByCode(code)
                  return port ? `${port.name} · ${port.code}` : code
                }}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Countries are derived from the port codes when saved: {portCountry(values.loadingPort) || '—'} →{' '}
            {portCountry(values.finalDestinationPort) || '—'}.
          </p>
        </div>

        <AdvancedSection title="Regulatory and route exceptions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select<ShippingBillFormValues>
              label="Discharge port"
              name="dischargePort"
              options={destinationPorts}
              placeholder="Defaults to destination"
            />
            <Select<ShippingBillFormValues>
              label="Origin state"
              name="originStateCode"
              options={stateOptions}
              placeholder="Defaults to Branch State Code"
            />
            <div />
            <Select<ShippingBillFormValues>
              label="NFEI category"
              name="nfeiCategory"
              options={nfeiCategories}
              placeholder="Not applicable"
            />
            <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
            <Input label="RBI waiver date" type={dateType} {...register('rbiWaiverDate')} />
          </div>
        </AdvancedSection>

        <div className="border-t border-gray-200 pt-5">
          <SectionHeading title="Package Detail" />
          <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Nature of cargo"
              name="natureOfCargo"
              options={cargoOptions}
            />
            <Input label="Gross weight" type="number" {...register('grossWeight')} />
            <Input label="Net weight" type="number" {...register('netWeight')} />
            <Select<ShippingBillFormValues>
              label="Weight unit"
              name="measurementUnit"
              options={weightUnits}
            />
            <Input label="Total packages" type="number" {...register('totalPackages')} />
            <Select<ShippingBillFormValues>
              label="Marks and numbers"
              name="marksAndNumbers"
              options={marksOptions}
              placeholder={
                !values.exporterId
                  ? 'Select exporter first'
                  : marksLoading
                    ? 'Loading marks and numbers...'
                    : 'Select marks and numbers'
              }
              disabled={!values.exporterId || marksLoading || !marksOptions.length}
              wrapClass="sm:col-span-3"
            />
          </div>

          <AdvancedSection title="Additional Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select<ShippingBillFormValues>
                label="Seal type"
                name="sealType"
                options={sealTypes}
                placeholder="Select if relevant"
              />
              {containersCount === 0 && (
                <Input label="Number of containers" type="number" {...register('numberOfContainers')} />
              )}
              <Input label="Loose packets" type="number" {...register('loosePackets')} />
              <Input label="MAWB number" {...register('mawbNumber')} />
              <Input label="HAWB number" {...register('hawbNumber')} />
            </div>
          </AdvancedSection>
        </div>
      </CardContent>
    </Card>
  )
}
