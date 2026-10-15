import { partyService } from '@/services/party.service'
import { Branch, Business, Exporter, ShippingBillFormValues } from '@/shipping-bills/model'
import { useEffect, useState } from 'react'
import { useForm } from 'core/form'
import { AsyncCombobox } from './async-combobox'

export type BranchPath =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`

export type OwnerPath =
  | 'exporterId'
  | 'consigneeId'
  | `invoices.${number}.buyerId`
  | `invoices.${number}.thirdPartyId`
  | `invoices.${number}.items.${number}.itemThirdPartyId`

export interface PartyPickerProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  ownerName: OwnerPath
  branchName: BranchPath
  label: string
  kind: 'exporter' | 'business'
  required?: boolean
  onAddBranch: (ownerId: number) => void
  onQuickAdd: () => void
}

export function PartyPicker({
  formCtx,
  ownerName,
  branchName,
  label,
  kind,
  required = true,
  onAddBranch,
  onQuickAdd
}: PartyPickerProps) {
  const ownerId = formCtx.hooks.watch(ownerName as any)
  const [currentOwner, setCurrentOwner] = useState<Exporter | Business | null>(null)

  // Fetch owner data asynchronously when ownerId changes
  useEffect(() => {
    let active = true
    if (!ownerId) {
      setCurrentOwner(null)
      return
    }

    const fetchOwner = async () => {
      const party =
        kind === 'exporter'
          ? await partyService.getExporterById(String(ownerId))
          : await partyService.getConsigneeById(String(ownerId))
      if (active && party) {
        setCurrentOwner(party)
      }
    }

    void fetchOwner()
    return () => {
      active = false
    }
  }, [kind, ownerId])

  // Validate branch when owner or branch selection changes
  useEffect(() => {
    const selectedBranch = formCtx.hooks.getValues(branchName as any)
    if (
      selectedBranch &&
      currentOwner &&
      currentOwner.branches.length > 0 &&
      !currentOwner.branches.some((branch: Branch) => String(branch.id) === selectedBranch)
    ) {
      formCtx.hooks.setValue(branchName as any, '', { shouldValidate: true })
    }
  }, [branchName, currentOwner, formCtx.hooks])

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{label}</span>
            <button
              type="button"
              className="text-xs font-semibold text-gray-900 hover:text-black hover:underline dark:text-gray-200 dark:hover:text-white"
              onClick={onQuickAdd}>
              + Add new
            </button>
          </div>
          <AsyncCombobox
            name={ownerName}
            placeholder={`Search & select ${kind}...`}
            rules={{ required }}
            fetchOptions={async (query) => {
              if (kind === 'exporter') {
                return partyService.searchExporters(query)
              }
              return partyService.searchConsignees(query)
            }}
            getInitialLabel={async (id) => {
              if (kind === 'exporter') {
                const item = await partyService.getExporterById(id)
                return item ? item.name : ''
              }
              const item = await partyService.getConsigneeById(id)
              return item ? item.name : ''
            }}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Branch / address</span>
            {currentOwner && (
              <button
                type="button"
                className="text-xs font-semibold text-gray-900 hover:text-black hover:underline dark:text-gray-200 dark:hover:text-white"
                onClick={() => onAddBranch(currentOwner.id)}>
                + Add branch
              </button>
            )}
          </div>
          <AsyncCombobox
            name={branchName}
            placeholder={currentOwner ? 'Search & select branch...' : `Choose ${kind} first`}
            disabled={!currentOwner}
            rules={{ required: required || !!ownerId }}
            deps={[ownerId]}
            fetchOptions={async (query) => {
              if (!ownerId) return []
              if (kind === 'exporter') {
                return partyService.searchExporterBranches(String(ownerId), query)
              }
              return partyService.searchConsigneeBranches(String(ownerId), query)
            }}
            getInitialLabel={async (id) => {
              const branch = currentOwner?.branches.find((b: Branch) => String(b.id) === id)
              return branch ? `${branch.branchName} · ${branch.city}` : ''
            }}
          />
        </div>
      </div>

      {currentOwner && (
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50/80 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          <span className="font-semibold text-gray-950 dark:text-white">{currentOwner.name}</span>
          {currentOwner.iec && (
            <span>
              · IEC: <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{currentOwner.iec}</span>
            </span>
          )}
          {currentOwner.branches && (
            <span className="ml-auto text-[11px] text-gray-500">
              {currentOwner.branches.length} {currentOwner.branches.length === 1 ? 'branch' : 'branches'} on file
            </span>
          )}
        </div>
      )}
    </div>
  )
}
