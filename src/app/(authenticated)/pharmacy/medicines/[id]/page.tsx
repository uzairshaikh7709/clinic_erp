import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, Plus, Minus, Edit, Package } from 'lucide-react'
import { StockBadge, ExpiryBadge } from '@/components/pharmacy/StockBadge'
import { MovementTypeBadge } from '@/components/pharmacy/MovementTypeBadge'
import DeleteMedicineButton from './DeleteMedicineButton'

export const dynamic = 'force-dynamic'

export default async function MedicineDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { clinicId } = await requirePharmacyEnabled()
    const admin = createAdminClient()

    const [{ data: medicine }, { data: batches }, { data: movements }] = await Promise.all([
        admin.from('medicines').select('*').eq('id', id).eq('organization_id', clinicId).single(),
        admin.from('medicine_batches')
            .select('*')
            .eq('medicine_id', id)
            .eq('organization_id', clinicId)
            .order('expiry_date', { ascending: true }),
        admin.from('stock_movements')
            .select('*, medicine_batches(batch_number), profiles:performed_by(full_name)')
            .eq('medicine_id', id)
            .eq('organization_id', clinicId)
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    if (!medicine) {
        return (
            <div className="text-center py-12">
                <Package size={40} className="mx-auto mb-3 text-slate-300" />
                <h2 className="text-lg font-bold text-slate-800">Medicine not found</h2>
                <Link href="/pharmacy/medicines" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">Back to Medicines</Link>
            </div>
        )
    }

    const totalStock = (batches || []).reduce((sum, b) => sum + b.quantity_remaining, 0)
    const activeBatches = (batches || []).filter(b => b.quantity_remaining > 0)

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/pharmacy/medicines" className="text-slate-400 hover:text-slate-700">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{medicine.name}</h1>
                        {medicine.generic_name && <p className="text-slate-500 text-sm">{medicine.generic_name}</p>}
                    </div>
                </div>
                <div className="flex gap-2 pl-8 sm:pl-0">
                    <Link href={`/pharmacy/medicines/${id}/stock-in`} className="btn btn-primary text-sm">
                        <Plus size={16} className="mr-1" /> Stock In
                    </Link>
                    <Link href={`/pharmacy/medicines/${id}/stock-out`} className="btn btn-secondary text-sm">
                        <Minus size={16} className="mr-1" /> Stock Out
                    </Link>
                    <Link href={`/pharmacy/medicines/${id}/edit`} className="btn btn-secondary text-sm">
                        <Edit size={16} className="mr-1" /> Edit
                    </Link>
                </div>
            </div>

            {/* Info Card */}
            <div className="card p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Total Stock</p>
                        <p className="text-2xl font-bold text-slate-900">{totalStock} <span className="text-sm font-normal text-slate-400">{medicine.unit}</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Category</p>
                        <p className="text-sm font-medium text-slate-800">{medicine.category || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Manufacturer</p>
                        <p className="text-sm font-medium text-slate-800">{medicine.manufacturer || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <StockBadge stock={totalStock} threshold={medicine.low_stock_threshold} />
                    </div>
                </div>
            </div>

            {/* Batches */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Batches ({activeBatches.length} active)</h3>
                    <Link href={`/pharmacy/medicines/${id}/stock-in`} className="text-sm font-medium text-indigo-600 hover:underline">+ Add Batch</Link>
                </div>
                {(batches || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No batches yet. Stock in to add a batch.</div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch #</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Expiry</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Received</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Remaining</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Price</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(batches || []).map(b => (
                                        <tr key={b.id} className={b.quantity_remaining === 0 ? 'opacity-50' : ''}>
                                            <td className="px-4 py-3 font-medium text-slate-800">{b.batch_number}</td>
                                            <td className="px-4 py-3 text-slate-600">{b.expiry_date}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{b.quantity_received}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">{b.quantity_remaining}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {b.selling_price ? `₹${b.selling_price}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {b.quantity_remaining === 0
                                                    ? <span className="text-xs text-slate-400">Empty</span>
                                                    : <ExpiryBadge expiryDate={b.expiry_date} />
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-100">
                            {(batches || []).map(b => (
                                <div key={b.id} className={`p-4 ${b.quantity_remaining === 0 ? 'opacity-50' : ''}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-slate-800">Batch {b.batch_number}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Expires: {b.expiry_date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">{b.quantity_remaining}/{b.quantity_received}</p>
                                            {b.quantity_remaining > 0 && <ExpiryBadge expiryDate={b.expiry_date} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Recent Movements */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Recent Movements</h3>
                </div>
                {(movements || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No movements yet.</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {(movements || []).map((m: any) => (
                            <div key={m.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <MovementTypeBadge type={m.movement_type} />
                                        {m.medicine_batches?.batch_number && (
                                            <span className="text-xs text-slate-400">Batch: {m.medicine_batches.batch_number}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {m.reason || '—'} &middot; {(m.profiles as any)?.full_name || 'System'} &middot;{' '}
                                        {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                    </p>
                                </div>
                                <span className={`text-sm font-bold flex-shrink-0 ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete */}
            <div className="card border-red-200">
                <div className="p-4 sm:p-5 border-b border-red-100 bg-red-50/50">
                    <h2 className="font-bold text-red-700 text-sm">Danger Zone</h2>
                </div>
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">Delete this medicine</p>
                        <p className="text-xs text-slate-500">All batches and movements will also be removed. Stock must be zero.</p>
                    </div>
                    <DeleteMedicineButton medicineId={id} medicineName={medicine.name} hasStock={totalStock > 0} />
                </div>
            </div>
        </div>
    )
}
