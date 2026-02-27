import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getMovementsPaginated } from '../actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import { MovementTypeBadge } from '@/components/pharmacy/MovementTypeBadge'
import Link from 'next/link'
import { ArrowDownToLine } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TYPE_FILTERS = [
    { key: '', label: 'All' },
    { key: 'stock_in', label: 'Stock In' },
    { key: 'stock_out', label: 'Stock Out' },
    { key: 'adjustment', label: 'Adjustment' },
    { key: 'expired', label: 'Expired' },
    { key: 'returned', label: 'Returned' },
]

export default async function MovementsPage({ searchParams }: { searchParams: Promise<{ page?: string; type?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const type = params.type || ''

    const { movements, totalCount } = await getMovementsPaginated(clinicId, page, type || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Stock Movements</h1>
                <p className="text-slate-500 text-sm">{totalCount} total movements</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {TYPE_FILTERS.map(f => (
                    <Link
                        key={f.key}
                        href={`/pharmacy/movements${f.key ? `?type=${f.key}` : ''}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            type === f.key
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            <div className="card overflow-hidden">
                {movements.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <ArrowDownToLine size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No movements found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date/Time</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Type</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Qty</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Reason</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {movements.map((m: any) => (
                                        <tr key={m.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                                                {new Date(m.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/medicines/${m.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                    {(m.medicines as any)?.name || 'Unknown'}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                {(m.medicine_batches as any)?.batch_number || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <MovementTypeBadge type={m.movement_type} />
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{m.reason || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{(m.profiles as any)?.full_name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {movements.map((m: any) => (
                                <div key={m.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{(m.medicines as any)?.name || 'Unknown'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MovementTypeBadge type={m.movement_type} />
                                                {(m.medicine_batches as any)?.batch_number && (
                                                    <span className="text-xs text-slate-400">{(m.medicine_batches as any).batch_number}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {(m.profiles as any)?.full_name || 'System'} &middot;{' '}
                                                {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-bold flex-shrink-0 ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/movements"
                            searchParams={type ? { type } : {}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
