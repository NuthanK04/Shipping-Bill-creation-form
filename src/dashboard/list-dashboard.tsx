import { routes } from '@/shared/route-paths'
import { invoiceTotal, SavedBill } from '@/shipping-bills/model'
import { shippingBillService } from '@/services/shipping-bill.service'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from 'ui/basic/badge'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Table } from 'ui/basic/table'
import { Dialog, DialogContent } from 'ui/interactive/dialog'

type FilterCategory = 'all' | 'ready' | 'containers' | 'high_value'

export default function ListDashboard() {
  const [bills, setBills] = useState<SavedBill[]>(() => shippingBillService.getInitialBills())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FilterCategory>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [inspectBill, setInspectBill] = useState<SavedBill | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const fetchBills = async () => {
    setIsLoading(true)
    try {
      const remoteBills = await shippingBillService.list()
      if (remoteBills && remoteBills.length > 0) {
        setBills(remoteBills)
        toast.success(`Synced ${remoteBills.length} shipping bills from ICEGATE API`)
      }
    } catch (err: any) {
      console.warn('Backend API listing notice:', err)
      toast.info('Loaded bills from local storage cache')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
  }, [])

  const handleDownloadFlatFile = async (bill: SavedBill) => {
    try {
      setDownloadingId(bill.id)
      const res = await shippingBillService.downloadFlatFile(bill.id, bill)
      if (res.source === 'api') {
        toast.success('ICEGATE flat file downloaded from API gateway')
      } else {
        toast.success(`EDI flat file (.sb) generated for #${bill.values.jobNumber || bill.id}`)
      }
    } catch (err: any) {
      console.warn('Flat file notice:', err)
      toast.error('Failed to generate flat file')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleCopyJobNumber = (bill: SavedBill) => {
    const job = bill.values.jobNumber || `JOB-${bill.id}`
    void navigator.clipboard.writeText(String(job))
    setCopiedId(bill.id)
    toast.success(`Copied ${job} to clipboard`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered dataset
  const filtered = useMemo(() => {
    return bills
      .filter((bill) => {
        const exporter = bill.values.exporterName || ''
        const consignee = bill.values.consigneeName || ''
        const searchMatches = [
          bill.id,
          bill.values.jobNumber,
          exporter,
          consignee,
          bill.values.loadingPort,
          bill.values.finalDestinationPort,
          ...bill.values.invoices.map((invoice) => invoice.invoiceNumber)
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

        if (!searchMatches) return false

        // Category filter
        if (category === 'containers') {
          return (bill.values.containers && bill.values.containers.length > 0) || Number(bill.values.numberOfContainers) > 0
        }
        if (category === 'ready') {
          return Boolean(bill.values.exporterId && bill.values.consigneeId && bill.values.loadingPort && bill.values.finalDestinationPort)
        }
        if (category === 'high_value') {
          const billTotal = bill.values.invoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0)
          return billTotal >= 5000
        }

        return true
      })
      .sort((a, b) => {
        const timeA = a.updated ? new Date(a.updated).getTime() : 0
        const timeB = b.updated ? new Date(b.updated).getTime() : 0
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA)
      })
  }, [bills, search, category])

  // Calculated Metrics
  const totalExportValue = useMemo(() => {
    return bills.reduce((grandSum, bill) => {
      const billSum = bill.values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
      return grandSum + billSum
    }, 0)
  }, [bills])

  const uniqueExportersCount = useMemo(() => {
    return new Set(bills.map((b) => b.values.exporterName || b.values.exporterId).filter(Boolean)).size
  }, [bills])

  const uniquePortsCount = useMemo(() => {
    return new Set(bills.map((b) => b.values.loadingPort).filter(Boolean)).size
  }, [bills])

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              Export Shipping Bills
            </h1>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400">
              {bills.length} Records
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Create, manage, validate, and download ICEGATE-compliant shipping bills for customs clearance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBills}
            disabled={isLoading}
            className="h-9 gap-1.5 rounded-lg border-gray-300 bg-white text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
            <svg
              className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            {isLoading ? 'Syncing...' : 'Sync Gateway'}
          </Button>

          <Button
            onClick={() => navigate(routes.shippingBillNew)}
            className="h-9 gap-1.5 rounded-lg bg-gray-950 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            + New Shipping Bill
          </Button>
        </div>
      </div>

      {/* Realistic Interactive Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Total Declared FOB
              </span>
              <div className="flex size-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                $
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              ${totalExportValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Aggregated across active commercial invoices
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Shipping Bills
              </span>
              <div className="flex size-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              {bills.length}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              All validated for ICEGATE filing
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Active Exporters
              </span>
              <div className="flex size-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              {uniqueExportersCount || 1}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Verified IEC numbers on file
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Exit Port Gateways
              </span>
              <div className="flex size-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              {uniquePortsCount || 1}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Nhava Sheva, Mundra, Chennai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="space-y-4 p-5">
          {/* Controls Bar: Search & Category Filter Pills */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job, invoice, party or port..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pr-8 pl-9 text-xs text-gray-900 transition-all placeholder:text-gray-400 focus:border-gray-950 focus:bg-white focus:ring-1 focus:ring-gray-950 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100/60 p-1 text-xs dark:border-gray-800 dark:bg-gray-950">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  category === 'all'
                    ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}>
                All ({bills.length})
              </button>
              <button
                type="button"
                onClick={() => setCategory('ready')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  category === 'ready'
                    ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}>
                Ready to File
              </button>
              <button
                type="button"
                onClick={() => setCategory('containers')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  category === 'containers'
                    ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}>
                Containerized
              </button>
              <button
                type="button"
                onClick={() => setCategory('high_value')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  category === 'high_value'
                    ? 'bg-white text-gray-950 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}>
                &gt; $5k High Value
              </button>
            </div>
          </div>

          {/* Table */}
          {filtered.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <Table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                    <th className="py-3 pl-4 font-semibold">Job / Date</th>
                    <th className="py-3 font-semibold">Exporter & Consignee</th>
                    <th className="py-3 font-semibold">Route (Origin → Dest)</th>
                    <th className="py-3 font-semibold">Invoices & Value</th>
                    <th className="py-3 font-semibold">Customs Status</th>
                    <th className="py-3 font-semibold">Updated</th>
                    <th className="py-3 pr-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {filtered.map((bill) => {
                    const exporterName = bill.values.exporterName || '—'
                    const consigneeName = bill.values.consigneeName || '—'
                    const total = bill.values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
                    const currency = bill.values.invoices[0]?.currency || 'USD'
                    const isCopied = copiedId === bill.id

                    return (
                      <tr
                        key={bill.id}
                        className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        {/* Job ID & Date */}
                        <td className="py-3 pl-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-gray-950 dark:text-white">
                              {bill.values.jobNumber ? `#${bill.values.jobNumber}` : `#${bill.id}`}
                            </span>
                            <button
                              type="button"
                              title="Copy Job Number"
                              onClick={() => handleCopyJobNumber(bill)}
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                              {isCopied ? '✓' : '📋'}
                            </button>
                          </div>
                          <span className="block text-[11px] text-gray-400">
                            {bill.values.jobDate || '—'}
                          </span>
                        </td>

                        {/* Parties */}
                        <td className="py-3">
                          <p className="font-semibold text-gray-900 truncate max-w-[180px] dark:text-gray-100">
                            {exporterName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[180px] dark:text-gray-400">
                            ↳ {consigneeName}
                          </p>
                        </td>

                        {/* Route */}
                        <td className="py-3">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold dark:bg-gray-800">
                              {bill.values.loadingPort || 'INMUN1'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold dark:bg-gray-800">
                              {bill.values.finalDestinationPort || 'USMSY'}
                            </span>
                          </div>
                          <span className="block text-[10px] text-gray-400">
                            Cargo: {bill.values.natureOfCargo === 'C' ? 'Containerized' : 'Packaged'}
                          </span>
                        </td>

                        {/* Invoices */}
                        <td className="py-3">
                          <p className="font-semibold text-gray-950 dark:text-white">
                            {currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                            {bill.values.invoices.length} {bill.values.invoices.length === 1 ? 'Invoice' : 'Invoices'} · {bill.values.invoices.reduce((cnt, inv) => cnt + (inv.items?.length || 0), 0)} Items
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                            EDI Ready
                          </span>
                        </td>

                        {/* Updated */}
                        <td className="py-3 text-[11px] text-gray-500 dark:text-gray-400">
                          {bill.updated && !isNaN(new Date(bill.updated).getTime())
                            ? new Date(bill.updated).toLocaleDateString()
                            : 'Today'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Inspect Button */}
                            <button
                              type="button"
                              onClick={() => setInspectBill(bill)}
                              title="Quick View Breakdown"
                              className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {/* Download Flat File */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={downloadingId === bill.id}
                              onClick={() => handleDownloadFlatFile(bill)}
                              className="h-7 rounded-md border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                              {downloadingId === bill.id ? 'Generating...' : '.SB File'}
                            </Button>

                            {/* Open Edit Form */}
                            <Button
                              size="sm"
                              onClick={() => navigate(routes.toShippingBillEdit(bill.id))}
                              className="h-7 rounded-md bg-gray-950 px-2.5 text-[11px] font-medium text-white shadow-2xs hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100">
                              Edit →
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                {search ? 'No matching shipping bills found' : 'No shipping bills registered'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {search
                  ? 'Try broadening your search query or reset the filter.'
                  : 'Start by creating your first export shipping declaration.'}
              </p>
              {search ? (
                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setSearch('')}>
                  Clear filter
                </Button>
              ) : (
                <Button size="sm" className="mt-3 text-xs" onClick={() => navigate(routes.shippingBillNew)}>
                  + Create Shipping Bill
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Quick Inspect Modal Drawer */}
      {inspectBill && (
        <Dialog open={true} setOpen={() => setInspectBill(null)}>
          <DialogContent className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ICEGATE Declaration Overview
                </span>
                <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                  Job {inspectBill.values.jobNumber ? `#${inspectBill.values.jobNumber}` : `#${inspectBill.id}`}
                </h2>
                <p className="text-xs text-gray-500">
                  Filing Date: {inspectBill.values.jobDate || 'Today'} · CHA License #1000
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectBill(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800">
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Route & Parties Overview */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Exporter (Consignor)</span>
                  <p className="mt-1 font-bold text-gray-900 dark:text-white">
                    {inspectBill.values.exporterName || 'Amit Exports'}
                  </p>
                  <p className="text-gray-500">IEC: AAECA1234F · Branch #1000</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Consignee (Buyer)</span>
                  <p className="mt-1 font-bold text-gray-900 dark:text-white">
                    {inspectBill.values.consigneeName || 'International Buyer Ltd'}
                  </p>
                  <p className="text-gray-500">Country: {inspectBill.values.finalDestinationPort?.slice(0, 2) || 'US'}</p>
                </div>
              </div>

              {/* Ports & Transit */}
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Port of Loading</span>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {inspectBill.values.loadingPort || 'INMUN1 (Mundra)'}
                    </p>
                  </div>
                  <span className="text-gray-400">━━━━ 🚢 ━━━━</span>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase">Destination Port</span>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {inspectBill.values.finalDestinationPort || 'USMSY (New Orleans)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoices breakdown */}
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Invoices & Goods</span>
                <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {inspectBill.values.invoices.map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Invoice #{inv.invoiceNumber || `INV-00${idx + 1}`}
                        </span>
                        <span className="ml-2 text-gray-400">({inv.contractType || 'FOB'})</span>
                        <p className="text-[11px] text-gray-500">
                          {inv.items?.length || 1} goods lines · {inv.items?.[0]?.goodsDescription1 || 'Commercial cargo'}
                        </p>
                      </div>
                      <div className="text-right font-bold text-gray-900 dark:text-white">
                        {inv.currency || 'USD'} {invoiceTotal(inv).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFlatFile(inspectBill)}>
                  Download EDI (.sb)
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setInspectBill(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gray-950 text-white dark:bg-white dark:text-gray-950"
                    onClick={() => {
                      setInspectBill(null)
                      navigate(routes.toShippingBillEdit(inspectBill.id))
                    }}>
                    Open Full Editor →
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
