import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getPurchaseReturnsPaginated } from '../purchase-actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import Link from 'next/link'
import { Plus, RotateCcw } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUSES = [
    { key: '', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'settled', label: 'Settled' },
]

export default async function PurchaseReturnsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const status = params.status || ''

    const { returns, totalCount } = await getPurchaseReturnsPaginated(clinicId, page, status || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Purchase Returns</h1>
                    <p className="text-slate-500 text-sm">{totalCount} return entries</p>
                </div>
                <Link href="/pharmacy/purchase-returns/new" className="btn btn-primary text-sm">
                    <Plus size={16} className="mr-1.5" /> New Return
                </Link>
            </div>

            <div className="flex gap-2 flex-wrap">
                {STATUSES.map(f => (
                    <Link
                        key={f.key}
                        href={`/pharmacy/purchase-returns${f.key ? `?status=${f.key}` : ''}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            status === f.key
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            <div className="card overflow-hidden">
                {returns.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <RotateCcw size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No purchase returns found</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Return #</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Supplier</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Reason</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {returns.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{r.return_number}</td>
                                            <td className="px-4 py-3 text-slate-500">{(r.suppliers as any)?.name || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.return_date}</td>
                                            <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.reason}</td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">₹{Number(r.grand_total).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <ReturnStatusBadge status={r.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-100">
                            {returns.map((r: any) => (
                                <div key={r.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">{r.return_number}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {(r.suppliers as any)?.name} &middot; {r.return_date}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">{r.reason}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-red-600">₹{Number(r.grand_total).toFixed(2)}</p>
                                            <ReturnStatusBadge status={r.status} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/purchase-returns"
                            searchParams={status ? { status } : {}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function ReturnStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
        submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700' },
        accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700' },
        settled: { label: 'Settled', className: 'bg-violet-50 text-violet-700' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}
