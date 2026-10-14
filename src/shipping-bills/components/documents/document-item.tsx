import { masterDataService } from '@/services/master-data.service'
import { ShippingBillFormValues } from '@/shipping-bills/model'
import { useState } from 'react'
import { useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Input } from 'ui/inputs/input'
import { AdvancedSection } from '../common/advanced-section'
import { AsyncCombobox } from '../common/async-combobox'

const dateType = 'date' as 'text'

export interface DocumentItemProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  index: number
  onRemove: () => void
}

export function DocumentItem({ formCtx, index, onRemove }: DocumentItemProps) {
  const { register, watch } = formCtx.hooks
  const basePath = `documents.${index}` as const
  const documentValues = watch(basePath)

  const hasCustomValues = Boolean(
    documentValues?.placeOfIssue ||
    documentValues?.invoiceSerialNumber ||
    documentValues?.itemSerialNumber ||
    documentValues?.issuingPartyCode ||
    documentValues?.issuingPartyName ||
    documentValues?.issuingPartyAddress1 ||
    documentValues?.issuingPartyAddress2 ||
    documentValues?.issuingPartyCity ||
    documentValues?.issuingPartyPin ||
    documentValues?.beneficiaryPartyCode ||
    documentValues?.beneficiaryPartyName ||
    documentValues?.beneficiaryPartyAddress1 ||
    documentValues?.beneficiaryPartyAddress2 ||
    documentValues?.beneficiaryPartyCity ||
    documentValues?.beneficiaryPartyPin ||
    documentValues?.fileType ||
    documentValues?.icegateId
  )

  const [showCustomDetails, setShowCustomDetails] = useState(hasCustomValues)

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Document {index + 1}</h3>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">Document type code</span>
          <AsyncCombobox
            name={`${basePath}.documentTypeCode`}
            placeholder="Search document type..."
            fetchOptions={(query) => masterDataService.searchDocumentCodes(query)}
            getInitialLabel={(code) => masterDataService.getDocumentCodeLabel(code)}
          />
        </div>
        <Input label="Image reference number" {...register(`${basePath}.imageReferenceNumber`)} />
        <Input label="Issue date" type={dateType} {...register(`${basePath}.documentIssueDate`)} />
      </div>

      <AdvancedSection
        title="Issuing party and ICEGATE details"
        open={showCustomDetails}
        onToggle={(isOpen) => setShowCustomDetails(isOpen)}>
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Reference number" {...register(`${basePath}.documentReferenceNumber`)} />
          <Input label="Expiry date" type={dateType} {...register(`${basePath}.documentExpiryDate`)} />
          <Input label="Invoice serial number" type="number" {...register(`${basePath}.invoiceSerialNumber`)} />
          <Input label="Item serial number" type="number" {...register(`${basePath}.itemSerialNumber`)} />
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">File type</span>
            <AsyncCombobox
              name={`${basePath}.fileType`}
              placeholder="Search file type..."
              className="bg-transparent"
              fetchOptions={async (query) => {
                const q = query.toLowerCase().trim()
                const options = [{ value: 'pdf', label: 'PDF' }]
                return options.filter((doc) => doc.label.toLowerCase().includes(q) || doc.value.toLowerCase().includes(q))
              }}
              getInitialLabel={async (val) => {
                const found = [{ value: 'pdf', label: 'PDF' }].find((doc) => doc.value === val || doc.label === val)
                return found ? found.label : val
              }}
            />
          </div>
          <Input label="Place of issue" {...register(`${basePath}.placeOfIssue`)} />
        </div>

        <div className="flex flex-col gap-4">
          <AdvancedSection title="Issuing & Beneficiary">
            <div className="flex flex-col gap-6 pt-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Issuing Details</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Issuing party code" {...register(`${basePath}.issuingPartyCode`)} />
                  <Input label="Issuing party name" {...register(`${basePath}.issuingPartyName`)} />
                  <Input label="Issuing address line 1" {...register(`${basePath}.issuingPartyAddress1`)} />
                  <Input label="Issuing address line 2" {...register(`${basePath}.issuingPartyAddress2`)} />
                  <Input label="Issuing city" {...register(`${basePath}.issuingPartyCity`)} />
                  <Input label="Issuing postal code" {...register(`${basePath}.issuingPartyPin`)} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Beneficiary Details</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Beneficiary code" {...register(`${basePath}.beneficiaryPartyCode`)} />
                  <Input label="Beneficiary name" {...register(`${basePath}.beneficiaryPartyName`)} />
                  <Input
                    label="Beneficiary address line 1"
                    {...register(`${basePath}.beneficiaryPartyAddress1`)}
                  />
                  <Input
                    label="Beneficiary address line 2"
                    {...register(`${basePath}.beneficiaryPartyAddress2`)}
                  />
                  <Input label="Beneficiary city" {...register(`${basePath}.beneficiaryPartyCity`)} />
                  <Input label="Beneficiary postal code" {...register(`${basePath}.beneficiaryPartyPin`)} />
                </div>
              </div>
            </div>
          </AdvancedSection>
        </div>
      </AdvancedSection>
    </div>
  )
}
