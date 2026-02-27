import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getBatchesPaginated } from '../actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import { ExpiryBadge } from '@/components/pharmacy/StockBadge'
import Link from 'next/link'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

const FILTERS = [
    { key: '', label: 'All Active' },
    { key: 'expiring', label: 'Expiring Soon' },
    { key: 'expired', label: 'Expired' },
]

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const filter = params.filter || ''

    const { batches, totalCount } = await getBatchesPaginated(clinicId, page, filter || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Batch Inventory</h1>
                <p className="text-slate-500 text-sm">All batches with remaining stock, sorted by expiry</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {FILTERS.map(f => (
                    <Link
                        key={f.key}
                        href={`/pharmacy/batches${f.key ? `?filter=${f.key}` : ''}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === f.key
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            <div className="card overflow-hidden">
                {batches.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Package size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No batches found</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch #</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Expiry Date</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Remaining</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Received</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {batches.map((b: any) => (
                                        <tr key={b.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/medicines/${b.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                    {(b.medicines as any)?.name || 'Unknown'}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{b.batch_number}</td>
                                            <td className="px-4 py-3 text-slate-600">{b.expiry_date}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">{b.quantity_remaining}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{b.quantity_received}</td>
                                            <td className="px-4 py-3 text-center">
                                                <ExpiryBadge expiryDate={b.expiry_date} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-100">
                            {batches.map((b: any) => (
                                <Link key={b.id} href={`/pharmacy/medicines/${b.medicine_id}`} className="block p-4 hover:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{(b.medicines as any)?.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Batch: {b.batch_number} &middot; Exp: {b.expiry_date}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-slate-800">{b.quantity_remaining}</p>
                                            <ExpiryBadge expiryDate={b.expiry_date} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/batches"
                            searchParams={filter ? { filter } : {}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
