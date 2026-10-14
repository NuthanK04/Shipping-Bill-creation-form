import { getDemoData, saveBill } from '@/shipping-bills/demo-store'
import { SavedBill, ShippingBillFormValues } from '@/shipping-bills/model'
import {
  API_SEED_SHIPPING_BILLS,
  generateFlatFileContent,
  normalizeApiBills,
  toHttpShippingBillPayload
} from '@/shipping-bills/shipping-bill-service'
import { mockDelay } from './api-client'

const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.PUBLIC_API_URL ||
  'http://192.168.1.123:3408'

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: 'tenantId=1000&user=1000&role=1'
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

export const shippingBillService = {
  /**
   * Return initial bills synchronously for initial state
   */
  getInitialBills(): SavedBill[] {
    const { bills } = getDemoData()
    if (bills && bills.length > 0) return bills
    return normalizeApiBills(API_SEED_SHIPPING_BILLS)
  },

  /**
   * Fetch all shipping bills asynchronously
   */
  async list(): Promise<SavedBill[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/shipping-bills`, {
        method: 'GET',
        headers: DEFAULT_HEADERS
      })
      if (response.ok) {
        const data = await response.json()
        const normalized = normalizeApiBills(data)
        if (normalized && normalized.length > 0) {
          return normalized
        }
      }
    } catch {
      // Backend API offline / mock mode fallback
    }

    const { bills } = getDemoData()
    if (bills && bills.length > 0) {
      return mockDelay(bills, 200)
    }
    const seed = normalizeApiBills(API_SEED_SHIPPING_BILLS)
    return mockDelay(seed, 200)
  },

  /**
   * Get single bill by ID asynchronously
   */
  async getById(id: string | number): Promise<SavedBill | undefined> {
    const { bills } = getDemoData()
    const found = bills.find((b) => String(b.id) === String(id))
    if (found) return mockDelay(found, 100)

    const seed = normalizeApiBills(API_SEED_SHIPPING_BILLS)
    const seedFound = seed.find((b) => String(b.id) === String(id))
    return mockDelay(seedFound, 100)
  },

  /**
   * Save or update shipping bill asynchronously
   */
  async save(values: ShippingBillFormValues, draftId?: number): Promise<SavedBill> {
    // Save to local reactive store
    const record = saveBill(values, draftId)

    // Attempt backend sync in parallel (if available)
    try {
      const payload = toHttpShippingBillPayload(values)
      await fetch(`${BASE_URL}/api/shipping-bills`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(payload)
      })
    } catch {
      // Backend offline notice; saved successfully in local mock database
    }

    return mockDelay(record, 250)
  },

  /**
   * Download shipping bill flat file (.sb)
   */
  async downloadFlatFile(
    id: string | number,
    billData?: SavedBill,
    fallbackFilename?: string
  ): Promise<{ source: 'api' | 'local' }> {
    let filename = fallbackFilename || `shipping_bill_${id}.sb`

    try {
      const response = await fetch(`${BASE_URL}/api/shipping-bills/${id}/flat-file`, {
        method: 'GET',
        headers: {
          Accept: '*/*',
          Authorization: DEFAULT_HEADERS.Authorization
        }
      })

      if (response.ok) {
        let blob: Blob
        const disposition = response.headers.get('content-disposition')
        if (disposition && disposition.includes('filename=')) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '')
          }
        }

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const json = await response.json()
          const content =
            typeof json === 'string'
              ? json
              : json.file || json.content || json.data || JSON.stringify(json, null, 2)
          blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        } else {
          blob = await response.blob()
        }

        triggerBlobDownload(blob, filename)
        return { source: 'api' }
      }
    } catch {
      // API unreachable, fall back to local generation
    }

    if (billData) {
      const flatFileContent = generateFlatFileContent(billData)
      const blob = new Blob([flatFileContent], { type: 'text/plain;charset=utf-8' })
      const safeJob = billData.values.jobNumber || billData.id
      triggerBlobDownload(blob, `shipping_bill_${safeJob}.sb`)
      return { source: 'local' }
    }

    throw new Error('No bill data available to generate flat file.')
  }
}
