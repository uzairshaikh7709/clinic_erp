import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getStockValuation, getDeadStockReport, getMovementAnalysis } from '../purchase-actions'
import Link from 'next/link'
import { BarChart3, Package, TrendingDown, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string; days?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const tab = params.tab || 'valuation'
    const days = parseInt(params.days || '90')

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Inventory Reports</h1>
                <p className="text-slate-500 text-sm">Stock valuation, dead stock, and movement analysis</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'valuation', label: 'Stock Valuation', icon: DollarSign },
                    { key: 'dead-stock', label: 'Dead Stock', icon: AlertTriangle },
                    { key: 'movement', label: 'Fast/Slow Moving', icon: TrendingUp },
                ].map(t => (
                    <Link
                        key={t.key}
                        href={`/pharmacy/reports?tab=${t.key}`}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === t.key
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </Link>
                ))}
            </div>

            {tab === 'valuation' && <StockValuationTab clinicId={clinicId} />}
            {tab === 'dead-stock' && <DeadStockTab clinicId={clinicId} days={days} />}
            {tab === 'movement' && <MovementAnalysisTab clinicId={clinicId} days={days} />}
        </div>
    )
}

// ── Stock Valuation Tab ──

async function StockValuationTab({ clinicId }: { clinicId: string }) {
    const { items, summary } = await getStockValuation(clinicId)

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <ValuationCard label="Cost Value" value={summary.total_cost_value} color="text-slate-800" />
                <ValuationCard label="Selling Value" value={summary.total_selling_value} color="text-indigo-700" />
                <ValuationCard label="MRP Value" value={summary.total_mrp_value} color="text-emerald-700" />
                <div className="card p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Profit Margin</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-700">
                        {summary.total_cost_value > 0
                            ? `${((summary.total_selling_value - summary.total_cost_value) / summary.total_cost_value * 100).toFixed(1)}%`
                            : '0%'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {summary.total_items} medicines &middot; {summary.total_batches} batches
                    </p>
                </div>
            </div>

            {summary.expired_cost_value > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
                    <span className="font-bold text-red-700">Warning:</span> ₹{summary.expired_cost_value.toFixed(2)} in expired stock and ₹{summary.expiring_30_cost_value.toFixed(2)} expiring within 30 days.
                    <Link href="/pharmacy/expiry" className="ml-2 text-red-700 underline font-medium">Manage Expiry</Link>
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Stock Valuation by Medicine</h3>
                </div>
                {items.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Package size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No stock data available</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Batches</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost Value</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Selling Value</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((m: any) => {
                                    const margin = m.cost_value > 0 ? ((m.selling_value - m.cost_value) / m.cost_value * 100) : 0
                                    return (
                                        <tr key={m.medicine_id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-800">{m.medicine_name}</p>
                                                {m.generic_name && <p className="text-xs text-slate-400">{m.generic_name}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{m.category || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">{m.total_stock} <span className="text-xs font-normal text-slate-400">{m.unit}</span></td>
                                            <td className="px-4 py-3 text-right text-slate-500">{m.batch_count}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">₹{m.cost_value.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">₹{m.selling_value.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

// ── Dead Stock Tab ──

async function DeadStockTab({ clinicId, days }: { clinicId: string; days: number }) {
    const { items, summary } = await getDeadStockReport(clinicId, days)

    return (
        <>
            <div className="flex gap-2 flex-wrap">
                {[60, 90, 120, 180].map(d => (
                    <Link
                        key={d}
                        href={`/pharmacy/reports?tab=dead-stock&days=${d}`}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            days === d
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {d}+ days idle
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Dead Stock Items</p>
                    <p className="text-2xl font-bold text-amber-600">{summary.total_dead_items}</p>
                </div>
                <div className="card p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Blocked Capital (Cost)</p>
                    <p className="text-2xl font-bold text-red-600">₹{summary.total_dead_value.toFixed(2)}</p>
                </div>
            </div>

            <div className="card overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <TrendingDown size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No dead stock detected</p>
                        <p className="text-sm mt-1">All medicines had movement within {days} days</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Days Idle</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost Value</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Selling Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item: any) => (
                                    <tr key={item.medicine_id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <Link href={`/pharmacy/medicines/${item.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                {item.medicine_name}
                                            </Link>
                                            {item.generic_name && <p className="text-xs text-slate-400">{item.generic_name}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">{item.total_stock}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${item.days_since_movement > 180 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {item.days_since_movement >= 9999 ? 'Never' : `${item.days_since_movement}d`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700">₹{item.stock_cost_value.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">₹{item.stock_selling_value.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

// ── Movement Analysis Tab ──

async function MovementAnalysisTab({ clinicId, days }: { clinicId: string; days: number }) {
    const { items, summary } = await getMovementAnalysis(clinicId, days)

    return (
        <>
            <div className="flex gap-2 flex-wrap">
                {[30, 60, 90, 180].map(d => (
                    <Link
                        key={d}
                        href={`/pharmacy/reports?tab=movement&days=${d}`}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            days === d
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Last {d} days
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <ClassCard label="Fast Moving" value={summary.fast} color="text-emerald-600" bg="bg-emerald-50" />
                <ClassCard label="Moderate" value={summary.moderate} color="text-blue-600" bg="bg-blue-50" />
                <ClassCard label="Slow Moving" value={summary.slow} color="text-amber-600" bg="bg-amber-50" />
                <ClassCard label="Dead / No Sale" value={summary.dead} color="text-red-600" bg="bg-red-50" />
            </div>

            <div className="card overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <BarChart3 size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No medicine data available</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Sold</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Purchased</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Velocity/day</th>
                                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Class</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item: any) => (
                                    <tr key={item.medicine_id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <Link href={`/pharmacy/medicines/${item.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                {item.medicine_name}
                                            </Link>
                                            {item.generic_name && <p className="text-xs text-slate-400">{item.generic_name}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">{item.current_stock}</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-bold">{item.total_sold}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{item.total_purchased}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{item.movement_velocity}</td>
                                        <td className="px-4 py-3 text-center">
                                            <MovementClassBadge classification={item.classification} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

function ValuationCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="card p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">{label}</p>
            <p className={`text-lg sm:text-xl font-bold ${color}`}>₹{value.toFixed(2)}</p>
        </div>
    )
}

function ClassCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
    return (
        <div className={`card p-3 sm:p-4 ${bg} border-0`}>
            <p className={`text-xs sm:text-sm font-medium ${color} opacity-70 mb-1`}>{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    )
}

function MovementClassBadge({ classification }: { classification: string }) {
    const config: Record<string, { label: string; className: string }> = {
        fast: { label: 'Fast', className: 'bg-emerald-50 text-emerald-700' },
        moderate: { label: 'Moderate', className: 'bg-blue-50 text-blue-700' },
        slow: { label: 'Slow', className: 'bg-amber-50 text-amber-700' },
        dead: { label: 'Dead', className: 'bg-red-50 text-red-700' },
    }
    const c = config[classification] || { label: classification, className: 'bg-slate-50 text-slate-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}
