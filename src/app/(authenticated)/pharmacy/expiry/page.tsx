import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getExpiryReport } from '../purchase-actions'
import { ExpiryBadge } from '@/components/pharmacy/StockBadge'
import Link from 'next/link'
import { AlertTriangle, Clock, Ban, ShieldAlert } from 'lucide-react'
import ExpiryWriteOffButton from './ExpiryWriteOffButton'

export const dynamic = 'force-dynamic'

export default async function ExpiryManagementPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const days = parseInt(params.days || '90')

    const { items, summary } = await getExpiryReport(clinicId, days)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Expiry Management</h1>
                    <p className="text-slate-500 text-sm">Track near-expiry and expired medicines</p>
                </div>
                {summary.expired > 0 && (
                    <ExpiryWriteOffButton expiredCount={summary.expired} />
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                <StatCard label="Expired" value={summary.expired} icon={Ban} color="text-red-500" bg="bg-red-50" />
                <StatCard label="0-30 Days" value={summary.expiring_30} icon={AlertTriangle} color="text-amber-500" bg="bg-amber-50" />
                <StatCard label="31-60 Days" value={summary.expiring_60} icon={Clock} color="text-blue-500" bg="bg-blue-50" />
                <StatCard label="61-90 Days" value={summary.expiring_90} icon={Clock} color="text-slate-500" bg="bg-slate-50" />
                <div className="card p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Cost at Risk</p>
                    <p className="text-lg sm:text-xl font-bold text-red-600">₹{summary.total_cost_at_risk.toFixed(2)}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[30, 60, 90, 180].map(d => (
                    <Link
                        key={d}
                        href={`/pharmacy/expiry?days=${d}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            days === d
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Next {d} Days
                    </Link>
                ))}
            </div>

            {/* Expiry Table */}
            <div className="card overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <ShieldAlert size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No expiry issues found</p>
                        <p className="text-sm mt-1">All batches within the {days}-day window are clear</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Expiry Date</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Days Left</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Qty</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost Value</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((item: any) => (
                                        <tr key={item.id} className={`hover:bg-slate-50/50 ${item.days_to_expiry < 0 ? 'bg-red-50/30' : ''}`}>
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/medicines/${item.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                    {item.medicine_name}
                                                </Link>
                                                {item.generic_name && (
                                                    <p className="text-xs text-slate-400">{item.generic_name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{item.batch_number}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.expiry_date}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${item.days_to_expiry < 0 ? 'text-red-600' : item.days_to_expiry <= 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                    {item.days_to_expiry < 0 ? `${Math.abs(item.days_to_expiry)}d ago` : `${item.days_to_expiry}d`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                {item.quantity_remaining} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">₹{item.cost_value.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <ExpiryBadge expiryDate={item.expiry_date} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {items.map((item: any) => (
                                <div key={item.id} className={`p-4 ${item.days_to_expiry < 0 ? 'bg-red-50/30' : ''}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{item.medicine_name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Batch: {item.batch_number} &middot; Exp: {item.expiry_date}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-slate-800">{item.quantity_remaining}</p>
                                            <ExpiryBadge expiryDate={item.expiry_date} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs">
                                        <span className={`font-bold ${item.days_to_expiry < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {item.days_to_expiry < 0 ? `Expired ${Math.abs(item.days_to_expiry)}d ago` : `${item.days_to_expiry} days left`}
                                        </span>
                                        <span className="text-slate-500">Cost: ₹{item.cost_value.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, color, bg }: {
    label: string; value: number; icon: any; color: string; bg: string
}) {
    return (
        <div className="card p-3 sm:p-4 flex items-start justify-between">
            <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} />
            </div>
        </div>
    )
}
