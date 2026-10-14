import { documentCodes } from '@/data/e-sanchit-codes'
import { quantityCodes } from '@/data/quantity-code'
import schemeCodes from '@/data/scheme-codes'
import { stateOptions } from '@/data/states'
import { Trades } from '@/data/trade-agrements'
import { cargoOptions, contractTypes, paymentTypes, priceInclusionTypes, sealTypes, weightUnits } from '@/data/types'
import { loadingPorts, PortOption, ports } from '@/shipping-bills/model'
import { AsyncSelectOption, mockDelay } from './api-client'

export interface SchemeInfo {
  value: string
  label: string
  drawback?: boolean
  RODTEP?: boolean
  ROSCTL?: boolean
  description?: string
}

export const CURRENCY_OPTIONS = ['USD', 'EUR', 'INR', 'AED', 'GBP', 'SGD'].map((value) => ({
  value,
  label: value
}))

export const NFEI_CATEGORIES = [
  { value: '01', label: 'Free trade sample' },
  { value: '02', label: 'Diplomatic goods' },
  { value: '03', label: 'Warranty replacement' },
  { value: '07', label: 'Gift parcel' },
  { value: '08', label: 'Other' }
]

export const IGST_PAYMENT_OPTIONS = [
  { value: 'NA', label: 'Not applicable' },
  { value: 'LUT', label: 'Under LUT / bond' },
  { value: 'P', label: 'Against payment' }
]

export const ACCESSORY_STATUS_OPTIONS = [
  { value: '0', label: 'No accessory' },
  { value: '1', label: 'Included free of cost' },
  { value: '2', label: 'Entered separately' }
]

export const CONTAINER_SIZES = [
  { value: '20', label: '20 ft' },
  { value: '40', label: '40 ft' },
  { value: '45', label: '45 ft' }
]

export const CONTAINER_SEAL_TYPES = [
  { value: '1', label: 'BTSL - Bottle Seal' },
  { value: '2', label: 'ESEAL - Electronic Seal' },
  { value: '3', label: 'RFID - Radio Frequency Identifier' }
]

export const masterDataService = {
  /**
   * Search Indian loading ports asynchronously
   */
  async searchLoadingPorts(query: string): Promise<AsyncSelectOption[]> {
    const q = query.trim().toLowerCase()
    const indianPorts = loadingPorts.filter((p) => p.code.startsWith('IN'))
    const filtered = indianPorts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    )
    const options: AsyncSelectOption[] = filtered.map((p) => ({
      value: p.code,
      label: `${p.name} · ${p.code}`,
      sublabel: `Country: ${p.countryCode}`
    }))
    return mockDelay(options, 150)
  },

  /**
   * Search destination / discharge ports asynchronously
   */
  async searchDestinationPorts(query: string): Promise<AsyncSelectOption[]> {
    const q = query.trim().toLowerCase()
    const allPorts = [...ports, ...loadingPorts]
    const seen = new Set<string>()
    const uniquePorts = allPorts.filter((p) => {
      if (seen.has(p.code)) return false
      seen.add(p.code)
      return true
    })

    const filtered = uniquePorts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    )
    const options: AsyncSelectOption[] = filtered.map((p) => ({
      value: p.code,
      label: `${p.name} · ${p.code}`,
      sublabel: `Country: ${p.countryCode}`
    }))
    return mockDelay(options, 150)
  },

  /**
   * Get single port by code
   */
  async getPortByCode(code: string): Promise<PortOption | undefined> {
    const allPorts = [...ports, ...loadingPorts]
    const found = allPorts.find((p) => p.code === code)
    return mockDelay(found, 50)
  },

  /**
   * Search e-Sanchit document type codes
   */
  async searchDocumentCodes(query: string): Promise<AsyncSelectOption[]> {
    const q = query.trim().toLowerCase()
    const filtered = documentCodes.filter(
      (d) => d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q)
    )
    const options: AsyncSelectOption[] = filtered.map((d) => ({
      value: d.value,
      label: d.label
    }))
    return mockDelay(options, 150)
  },

  /**
   * Get document code label by code
   */
  async getDocumentCodeLabel(code: string): Promise<string> {
    const found = documentCodes.find((d) => d.value === code || d.label === code)
    return mockDelay(found ? found.label : code, 50)
  },

  /**
   * Get export incentive schemes
   */
  async getSchemeCodes(): Promise<SchemeInfo[]> {
    return mockDelay(schemeCodes as SchemeInfo[], 100)
  },

  /**
   * Find scheme by code
   */
  async getSchemeByCode(code?: string): Promise<SchemeInfo | undefined> {
    if (!code) return undefined
    const found = (schemeCodes as SchemeInfo[]).find((s) => s.value === code)
    return mockDelay(found, 50)
  },

  /**
   * Get quantity codes / units of measurement
   */
  async getQuantityCodes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(quantityCodes, 100)
  },

  /**
   * Get Indian states
   */
  async getStates(): Promise<{ value: string | number; label: string }[]> {
    return mockDelay(stateOptions, 100)
  },

  /**
   * Get trade agreements
   */
  async getTradeAgreements(): Promise<{ value: string; label: string }[]> {
    return mockDelay(Trades, 100)
  },

  /**
   * Get supported currencies
   */
  async getCurrencies(): Promise<{ value: string; label: string }[]> {
    return mockDelay(CURRENCY_OPTIONS, 50)
  },

  /**
   * Get contract types (FOB, CIF, etc.)
   */
  async getContractTypes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(contractTypes, 50)
  },

  /**
   * Get payment nature types
   */
  async getPaymentTypes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(paymentTypes, 50)
  },

  /**
   * Get price inclusion options
   */
  async getPriceInclusionTypes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(priceInclusionTypes, 50)
  },

  /**
   * Get nature of cargo
   */
  async getCargoOptions(): Promise<{ value: string; label: string }[]> {
    return mockDelay(cargoOptions, 50)
  },

  /**
   * Get weight units
   */
  async getWeightUnits(): Promise<{ value: string; label: string }[]> {
    return mockDelay(weightUnits, 50)
  },

  /**
   * Get seal types
   */
  async getSealTypes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(sealTypes, 50)
  },

  /**
   * Get container sizes
   */
  async getContainerSizes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(CONTAINER_SIZES, 50)
  },

  /**
   * Get container seal types
   */
  async getContainerSealTypes(): Promise<{ value: string; label: string }[]> {
    return mockDelay(CONTAINER_SEAL_TYPES, 50)
  },

  /**
   * Get NFEI categories
   */
  async getNfeiCategories(): Promise<{ value: string; label: string }[]> {
    return mockDelay(NFEI_CATEGORIES, 50)
  },

  /**
   * Get IGST payment status options
   */
  async getIgstPaymentOptions(): Promise<{ value: string; label: string }[]> {
    return mockDelay(IGST_PAYMENT_OPTIONS, 50)
  },

  /**
   * Get accessory status options
   */
  async getAccessoryStatusOptions(): Promise<{ value: string; label: string }[]> {
    return mockDelay(ACCESSORY_STATUS_OPTIONS, 50)
  }
}
