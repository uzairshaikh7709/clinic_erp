import { requirePharmacyStatsAccess } from '@/utils/auth'
import { getPharmacyOwnerStats } from '../actions'
import { Pill, Receipt, IndianRupee, AlertTriangle, Clock, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PharmacyStatsPage() {
    const profile = await requirePharmacyStatsAccess()
    const stats = await getPharmacyOwnerStats(profile.clinic_id)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Pharmacy Statistics</h1>
                <p className="text-slate-500 text-sm">Overview of pharmacy performance and sales</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <StatsCard label="Total Medicines" value={stats.totalMedicines} icon={Pill} color="text-indigo-500" bg="bg-indigo-50" />
                <StatsCard label="Total Invoices" value={stats.totalInvoices} icon={Receipt} color="text-blue-500" bg="bg-blue-50" />
                <RevenueCard label="Today's Revenue" value={stats.todayRevenue} icon={IndianRupee} color="text-emerald-500" bg="bg-emerald-50" />
                <RevenueCard label="Monthly Revenue" value={stats.monthRevenue} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
                <StatsCard label="Unpaid Invoices" value={stats.unpaidCount} icon={Clock} color="text-amber-500" bg="bg-amber-50" />
                <StatsCard label="Low Stock" value={stats.lowStockCount} icon={AlertTriangle} color="text-red-500" bg="bg-red-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Monthly Revenue */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-400" />
                        <h3 className="font-bold text-slate-800">Monthly Revenue</h3>
                    </div>
                    <div className="p-4 sm:p-5">
                        <div className="flex items-end gap-2 h-40">
                            {stats.monthlyRevenue.map((m: any) => {
                                const maxRev = Math.max(...stats.monthlyRevenue.map((r: any) => r.revenue), 1)
                                const height = Math.max((m.revenue / maxRev) * 100, 4)
                                return (
                                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {m.revenue > 0 ? `₹${m.revenue >= 1000 ? (m.revenue / 1000).toFixed(1) + 'k' : m.revenue.toFixed(0)}` : ''}
                                        </span>
                                        <div
                                            className="w-full bg-emerald-400 rounded-t-md transition-all"
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                        />
                                        <span className="text-[10px] text-slate-400">{m.month}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Selling Medicines */}
                <div className="card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                        <Pill size={18} className="text-indigo-400" />
                        <h3 className="font-bold text-slate-800">Top Sellers</h3>
                    </div>
                    {stats.topMedicines.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No sales data yet</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {stats.topMedicines.map((m: any, i: number) => (
                                <div key={m.name} className="px-4 sm:px-5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                                        <span className="text-sm font-medium text-slate-800 truncate">{m.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600 flex-shrink-0">{m.quantity} sold</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                    <Receipt size={18} className="text-blue-400" />
                    <h3 className="font-bold text-slate-800">Recent Invoices</h3>
                </div>
                {stats.recentInvoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No invoices yet</div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Invoice #</th>
                                        <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Patient</th>
                                        <th className="text-right px-4 py-2.5 text-slate-500 font-semibold">Amount</th>
                                        <th className="text-center px-4 py-2.5 text-slate-500 font-semibold">Status</th>
                                        <th className="text-right px-4 py-2.5 text-slate-500 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.recentInvoices.map((inv: any) => (
                                        <tr key={inv.id}>
                                            <td className="px-4 py-3 font-medium text-indigo-600">{inv.invoice_number}</td>
                                            <td className="px-4 py-3 text-slate-800">{inv.patient_name}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900">₹{Number(inv.grand_total).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={inv.payment_status} />
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="sm:hidden divide-y divide-slate-50">
                            {stats.recentInvoices.map((inv: any) => (
                                <div key={inv.id} className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-indigo-600">{inv.invoice_number}</span>
                                        <StatusBadge status={inv.payment_status} />
                                    </div>
                                    <p className="text-sm text-slate-800">{inv.patient_name}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-slate-400">
                                            {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900">₹{Number(inv.grand_total).toFixed(2)}</span>
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

function StatsCard({ label, value, icon: Icon, color, bg }: {
    label: string; value: number; icon: any; color: string; bg: string
}) {
    return (
        <div className="card p-3 sm:p-5 flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
            </div>
        </div>
    )
}

function RevenueCard({ label, value, icon: Icon, color, bg }: {
    label: string; value: number; icon: any; color: string; bg: string
}) {
    return (
        <div className="card p-3 sm:p-5 flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">₹{value.toFixed(0)}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        paid: 'bg-emerald-50 text-emerald-700',
        partial: 'bg-amber-50 text-amber-700',
        unpaid: 'bg-red-50 text-red-700',
    }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status as keyof typeof styles] || 'bg-slate-50 text-slate-600'}`}>
            {status}
        </span>
    )
}
