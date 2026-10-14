import { getDemoData, saveBranch, saveBusiness, saveExporter } from '@/shipping-bills/demo-store'
import { getMarksAndNumbersOptions, MarksAndNumbersOption } from '@/shipping-bills/marks-and-numbers-source'
import { Branch, Business, Exporter } from '@/shipping-bills/model'
import { AsyncSelectOption, mockDelay } from './api-client'

export const partyService = {
  /**
   * Search active exporters by name or IEC
   */
  async searchExporters(query: string): Promise<AsyncSelectOption[]> {
    const { exporters } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = exporters.filter(
      (item) => !item.disabled && (item.name.toLowerCase().includes(q) || item.iec.toLowerCase().includes(q))
    )
    const options: AsyncSelectOption[] = filtered.map((item) => ({
      value: String(item.id),
      label: item.name,
      sublabel: item.iec ? `IEC: ${item.iec}` : undefined,
      data: item
    }))
    return mockDelay(options, 180)
  },

  /**
   * Fetch single exporter by ID
   */
  async getExporterById(exporterId: string): Promise<Exporter | undefined> {
    if (!exporterId) return undefined
    const { exporters } = getDemoData()
    const found = exporters.find((item) => String(item.id) === exporterId)
    return mockDelay(found, 50)
  },

  /**
   * Search branches belonging to an exporter
   */
  async searchExporterBranches(exporterId: string, query: string): Promise<AsyncSelectOption[]> {
    if (!exporterId) return mockDelay([], 50)
    const { exporters } = getDemoData()
    const exporter = exporters.find((item) => String(item.id) === exporterId)
    if (!exporter) return mockDelay([], 50)

    const q = query.trim().toLowerCase()
    const filtered = exporter.branches.filter(
      (b) => b.branchName.toLowerCase().includes(q) || b.city.toLowerCase().includes(q)
    )
    const options: AsyncSelectOption[] = filtered.map((branch) => ({
      value: String(branch.id),
      label: `${branch.branchName} · ${branch.city}`,
      sublabel: branch.address1,
      data: branch
    }))
    return mockDelay(options, 120)
  },

  /**
   * Search consignees by name
   */
  async searchConsignees(query: string): Promise<AsyncSelectOption[]> {
    const { businesses } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = businesses.filter((item) => item.isConsignee && item.name.toLowerCase().includes(q))
    const options: AsyncSelectOption[] = filtered.map((item) => ({
      value: String(item.id),
      label: item.name,
      sublabel: item.iec ? `IEC: ${item.iec}` : undefined,
      data: item
    }))
    return mockDelay(options, 180)
  },

  /**
   * Fetch single consignee / business by ID
   */
  async getConsigneeById(consigneeId: string): Promise<Business | undefined> {
    if (!consigneeId) return undefined
    const { businesses } = getDemoData()
    const found = businesses.find((item) => String(item.id) === consigneeId)
    return mockDelay(found, 50)
  },

  /**
   * Search branches belonging to a consignee or business
   */
  async searchConsigneeBranches(consigneeId: string, query: string): Promise<AsyncSelectOption[]> {
    if (!consigneeId) return mockDelay([], 50)
    const { businesses } = getDemoData()
    const consignee = businesses.find((item) => String(item.id) === consigneeId)
    if (!consignee) return mockDelay([], 50)

    const q = query.trim().toLowerCase()
    const filtered = consignee.branches.filter(
      (b) => b.branchName.toLowerCase().includes(q) || b.city.toLowerCase().includes(q)
    )
    const options: AsyncSelectOption[] = filtered.map((branch) => ({
      value: String(branch.id),
      label: `${branch.branchName} · ${branch.city}`,
      sublabel: branch.address1,
      data: branch
    }))
    return mockDelay(options, 120)
  },

  /**
   * Search businesses with role filter (buyers, third-party)
   */
  async searchBusinesses(
    query: string,
    role?: 'buyer' | 'thirdParty' | 'consignee'
  ): Promise<AsyncSelectOption[]> {
    const { businesses } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = businesses.filter((b) => {
      if (role === 'buyer' && !b.isBuyer) return false
      if (role === 'thirdParty' && !b.isThirdParty) return false
      if (role === 'consignee' && !b.isConsignee) return false
      return b.name.toLowerCase().includes(q)
    })
    const options: AsyncSelectOption[] = filtered.map((item) => ({
      value: String(item.id),
      label: item.name,
      data: item
    }))
    return mockDelay(options, 150)
  },

  /**
   * Fetch marks and numbers options for a given exporter
   */
  async getMarksAndNumbers(exporterId: string): Promise<MarksAndNumbersOption[]> {
    if (!exporterId) return mockDelay([], 50)
    const options = await getMarksAndNumbersOptions(exporterId)
    return mockDelay(options, 120)
  },

  /**
   * Create a new exporter (used by quick-add dialog)
   */
  async createExporter(
    exporter: Omit<Exporter, 'id' | 'branches'> & { id?: number; firstBranch?: Omit<Branch, 'id'> }
  ): Promise<Exporter> {
    const created = saveExporter(exporter)
    return mockDelay(created, 200)
  },

  /**
   * Create a new business (used by quick-add dialog)
   */
  async createBusiness(
    business: Omit<Business, 'id' | 'branches'> & { id?: number; firstBranch?: Omit<Branch, 'id'> }
  ): Promise<Business> {
    const created = saveBusiness(business)
    return mockDelay(created, 200)
  },

  /**
   * Add branch to existing party
   */
  async addBranch(
    kind: 'exporter' | 'business',
    ownerId: number,
    branch: Omit<Branch, 'id'> & { id?: number }
  ): Promise<Branch> {
    const created = saveBranch(kind, ownerId, branch)
    return mockDelay(created, 200)
  }
}
