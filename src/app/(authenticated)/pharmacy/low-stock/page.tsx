import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LowStockPage() {
    const { clinicId } = await requirePharmacyEnabled()
    const admin = createAdminClient()

    const { data: lowStockItems } = await admin.rpc('get_low_stock_medicines', { org_id: clinicId })

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Low Stock Alerts</h1>
                <p className="text-slate-500 text-sm">Medicines below their configured stock threshold</p>
            </div>

            {!lowStockItems || lowStockItems.length === 0 ? (
                <div className="card p-12 text-center">
                    <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
                    <p className="font-medium text-slate-800">All medicines are well-stocked</p>
                    <p className="text-sm text-slate-500 mt-1">No medicines are below their low stock threshold.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-red-50/50 border-b border-red-100">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Current Stock</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Threshold</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Deficit</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lowStockItems.map((item: any) => (
                                    <tr key={item.medicine_id} className="hover:bg-red-50/30">
                                        <td className="px-4 py-3">
                                            <Link href={`/pharmacy/medicines/${item.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                {item.medicine_name}
                                            </Link>
                                            {item.generic_name && (
                                                <p className="text-xs text-slate-400">{item.generic_name}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${item.total_stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {item.total_stock}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600">{item.low_stock_threshold} {item.unit}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">
                                            {item.low_stock_threshold - Number(item.total_stock)} {item.unit}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/pharmacy/medicines/${item.medicine_id}/stock-in`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                                            >
                                                <Plus size={14} /> Stock In
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {lowStockItems.map((item: any) => (
                            <div key={item.medicine_id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link href={`/pharmacy/medicines/${item.medicine_id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                            {item.medicine_name}
                                        </Link>
                                        <p className="text-xs text-slate-400 mt-0.5">{item.category || item.generic_name || ''}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`font-bold ${item.total_stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {item.total_stock}
                                        </span>
                                        <span className="text-xs text-slate-400">/{item.low_stock_threshold} {item.unit}</span>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <Link
                                        href={`/pharmacy/medicines/${item.medicine_id}/stock-in`}
                                        className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Stock In
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
