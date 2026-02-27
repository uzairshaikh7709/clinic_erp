import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getAuditLogs } from '../actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ENTITY_FILTERS = [
    { key: '', label: 'All' },
    { key: 'prescription', label: 'Dispensing' },
    { key: 'invoice', label: 'Invoices' },
    { key: 'medicine', label: 'Medicines' },
    { key: 'batch', label: 'Batches' },
]

const ACTION_BADGE: Record<string, string> = {
    dispense: 'bg-indigo-50 text-indigo-700',
    invoice_create: 'bg-blue-50 text-blue-700',
    payment: 'bg-emerald-50 text-emerald-700',
    stock_in: 'bg-green-50 text-green-700',
    stock_out: 'bg-red-50 text-red-700',
    stock_adjust: 'bg-amber-50 text-amber-700',
    batch_expired: 'bg-orange-50 text-orange-700',
    medicine_delete: 'bg-red-50 text-red-700',
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; entity?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const entity = params.entity || ''

    const { logs, totalCount } = await getAuditLogs(clinicId, page, entity || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Audit Log</h1>
                <p className="text-slate-500 text-sm">Immutable record of all pharmacy operations</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {ENTITY_FILTERS.map(f => (
                    <Link
                        key={f.key}
                        href={`/pharmacy/audit${f.key ? `?entity=${f.key}` : ''}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            entity === f.key
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            <div className="card overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Shield size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No audit records found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date/Time</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Entity</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Details</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                                                {new Date(log.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_BADGE[log.action] || 'bg-slate-50 text-slate-600'}`}>
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs capitalize">{log.entity_type}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs max-w-[300px] truncate">
                                                {log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{(log.profiles as any)?.full_name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {logs.map((log: any) => (
                                <div key={log.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_BADGE[log.action] || 'bg-slate-50 text-slate-600'}`}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                            <p className="text-xs text-slate-400 mt-1 capitalize">{log.entity_type}</p>
                                            <p className="text-xs text-slate-400">
                                                {(log.profiles as any)?.full_name || 'System'} &middot;{' '}
                                                {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/audit"
                            searchParams={entity ? { entity } : {}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
