import { emptyDocument, ShippingBillFormValues } from '@/shipping-bills/model'
import { useFieldArray, useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { ContainerItem } from '../cargo/container-item'
import { PackingRangeItem } from '../cargo/packing-range-item'
import { AdvancedSection } from '../common/advanced-section'
import { SectionHeading } from '../common/section-heading'
import { DocumentItem } from '../documents/document-item'
import { LicenceItem } from '../documents/licence-item'

export interface DocumentsTabProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
}

export function DocumentsTab({ formCtx }: DocumentsTabProps) {
  const { control } = formCtx.hooks

  const {
    fields: containers,
    append: addContainer,
    remove: removeContainer
  } = useFieldArray({ control, name: 'containers' })

  const {
    fields: packingRanges,
    append: addPackingRange,
    remove: removePackingRange
  } = useFieldArray({ control, name: 'packingRanges' })

  const {
    fields: documents,
    append: addDocument,
    remove: removeDocument
  } = useFieldArray({ control, name: 'documents' })

  const {
    fields: licenses,
    append: addLicense,
    remove: removeLicense
  } = useFieldArray({ control, name: 'licenses' })

  return (
    <div className="space-y-4">
      {/* Containers & Packing ranges */}
      <Card>
        <CardHeader title="Cargo & Package Detail" />
        <CardContent className="space-y-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading
              title={`Containers (${containers.length})`}
              description="Add only when the cargo is containerized."
            />
            <Button size="sm" variant="outline" onClick={() => addContainer({ containerNumber: '' })}>
              + Add container
            </Button>
          </div>

          <div className="space-y-3">
            {containers.map((field, index) => (
              <ContainerItem
                key={field.id}
                formCtx={formCtx}
                index={index}
                onRemove={() => removeContainer(index)}
              />
            ))}
          </div>

          <AdvancedSection title={`Packing list ranges (${packingRanges.length})`}>
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPackingRange({ packingNumberFrom: '', packingNumberTo: '' })}>
                + Add packing range
              </Button>
              {packingRanges.map((field, index) => (
                <PackingRangeItem
                  key={field.id}
                  formCtx={formCtx}
                  index={index}
                  onRemove={() => removePackingRange(index)}
                />
              ))}
            </div>
          </AdvancedSection>
        </CardContent>
      </Card>

      {/* Supporting documents */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-950">Supporting documents</h3>
            <p className="mt-1 text-sm text-gray-500">Add references when required for this shipment.</p>
          </div>
          {documents.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
              + Add document
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
              + Add document
            </Button>
          )}
          {documents.map((field, index) => (
            <DocumentItem
              key={field.id}
              formCtx={formCtx}
              index={index}
              onRemove={() => removeDocument(index)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Licences */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-950">Licences</h3>
            <p className="mt-1 text-sm text-gray-500">Only enter these for schemes that require a licence.</p>
          </div>
          {licenses.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => addLicense({ registrationNumber: '' })}>
              + Add licence
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {licenses.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => addLicense({ registrationNumber: '' })}>
              + Add licence
            </Button>
          )}
          {licenses.map((field, index) => (
            <LicenceItem
              key={field.id}
              formCtx={formCtx}
              index={index}
              onRemove={() => removeLicense(index)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
