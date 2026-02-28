import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getPharmacyDashboardStats } from '../actions'
import Link from 'next/link'
import { Pill, AlertTriangle, Clock, Package, Plus, ArrowDownToLine, ChevronRight, FileText, Receipt, IndianRupee, ShoppingCart, Truck, BarChart3, Timer } from 'lucide-react'
import { MovementTypeBadge } from '@/components/pharmacy/MovementTypeBadge'

export const dynamic = 'force-dynamic'

export default async function PharmacyDashboard() {
    const { clinicId } = await requirePharmacyEnabled()
    const stats = await getPharmacyDashboardStats(clinicId)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Pharmacy</h1>
                <p className="text-slate-500 text-sm">Inventory management & stock tracking</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                    label="Total Medicines"
                    value={stats.totalMedicines}
                    icon={Pill}
                    color="text-indigo-500"
                    bg="bg-indigo-50"
                    href="/pharmacy/medicines"
                />
                <StatCard
                    label="Low Stock"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    color="text-red-500"
                    bg="bg-red-50"
                    href="/pharmacy/low-stock"
                />
                <StatCard
                    label="Pending Dispense"
                    value={stats.pendingDispenseCount}
                    icon={FileText}
                    color="text-indigo-500"
                    bg="bg-indigo-50"
                    href="/pharmacy/dispense"
                />
                <StatCard
                    label="Expiring Soon"
                    value={stats.expiringSoonCount}
                    icon={Clock}
                    color="text-amber-500"
                    bg="bg-amber-50"
                    href="/pharmacy/batches?filter=expiring"
                />
                <StatCard
                    label="Expired"
                    value={stats.expiredCount}
                    icon={Package}
                    color="text-red-500"
                    bg="bg-red-50"
                    href="/pharmacy/batches?filter=expired"
                />
                <RevenueCard value={stats.todayRevenue} unpaidCount={stats.unpaidInvoiceCount} />
            </div>

            {/* Pending Prescriptions */}
            {stats.pendingPrescriptions.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-indigo-400" />
                            <h3 className="font-bold text-slate-800">Pending Prescriptions</h3>
                        </div>
                        <Link href="/pharmacy/dispense" className="text-sm font-medium text-indigo-600 hover:underline">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {stats.pendingPrescriptions.map((rx: any) => (
                            <Link key={rx.id} href={`/pharmacy/dispense/${rx.id}`} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                        {(rx.patients as any)?.full_name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Dr. {(rx.doctors as any)?.profiles?.full_name || '—'} &middot;{' '}
                                        {new Date(rx.created_at).toLocaleString('en-US', {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                        })}
                                    </p>
                                </div>
                                <span className="text-sm font-medium text-indigo-600 flex-shrink-0">Dispense</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Recent Movements */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ArrowDownToLine size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">Recent Movements</h3>
                        </div>
                        <Link href="/pharmacy/movements" className="text-sm font-medium text-indigo-600 hover:underline">View All</Link>
                    </div>

                    {stats.recentMovements.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No stock movements yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {stats.recentMovements.map((m: any) => (
                                <div key={m.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {(m.medicines as any)?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(m.created_at).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <MovementTypeBadge type={m.movement_type} />
                                        <span className={`text-sm font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                        <ChevronRight size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-800">Quick Actions</h3>
                    </div>
                    <div className="p-3 sm:p-4 space-y-2">
                        <QuickAction href="/pharmacy/dispense" icon={FileText} label="Dispense Rx" />
                        <QuickAction href="/pharmacy/purchases/new" icon={ShoppingCart} label="New Purchase" />
                        <QuickAction href="/pharmacy/invoices/new" icon={Receipt} label="New Invoice" />
                        <QuickAction href="/pharmacy/medicines/new" icon={Plus} label="Add Medicine" />
                        <QuickAction href="/pharmacy/suppliers" icon={Truck} label="Suppliers" />
                        <QuickAction href="/pharmacy/expiry" icon={Timer} label="Expiry Tracker" />
                        <QuickAction href="/pharmacy/reports" icon={BarChart3} label="Reports" />
                        <QuickAction href="/pharmacy/low-stock" icon={AlertTriangle} label="Low Stock Alerts" />
                        <QuickAction href="/pharmacy/movements" icon={ArrowDownToLine} label="Movement History" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, color, bg, href }: {
    label: string; value: number; icon: any; color: string; bg: string; href: string
}) {
    return (
        <Link href={href} className="card card-hover p-3 sm:p-5 flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
            </div>
        </Link>
    )
}

function RevenueCard({ value, unpaidCount }: { value: number; unpaidCount: number }) {
    return (
        <Link href="/pharmacy/invoices" className="card card-hover p-3 sm:p-5 flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">Today&apos;s Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">₹{value.toFixed(0)}</p>
                {unpaidCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">{unpaidCount} unpaid</p>
                )}
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <IndianRupee size={20} className="sm:hidden" />
                <IndianRupee size={24} className="hidden sm:block" />
            </div>
        </Link>
    )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link href={href} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
            <span className="flex items-center gap-2"><Icon size={16} className="text-indigo-500" /> {label}</span>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
        </Link>
    )
}
