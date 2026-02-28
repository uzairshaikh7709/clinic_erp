import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getPurchaseDetail } from '../../purchase-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PurchaseActions from './PurchaseActions'

export const dynamic = 'force-dynamic'

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const { id } = await params
    const { purchase, items } = await getPurchaseDetail(clinicId, id)

    if (!purchase) notFound()

    const supplier = purchase.suppliers as any
    const createdBy = (purchase.profiles as any)?.full_name

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex items-start gap-3">
                <Link href="/pharmacy/purchases" className="btn btn-ghost text-sm mt-1">
                    <ArrowLeft size={16} />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{purchase.purchase_number}</h1>
                        <StatusBadge status={purchase.status} />
                        <PaymentBadge status={purchase.payment_status} />
                    </div>
                    <p className="text-slate-500 text-sm">
                        {supplier?.name} &middot; {purchase.purchase_date}
                        {createdBy && <span> &middot; Created by {createdBy}</span>}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <PurchaseActions purchase={purchase} />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SummaryCard label="Subtotal" value={purchase.subtotal} />
                <SummaryCard label="Tax" value={purchase.tax_total} />
                <SummaryCard label="Discount" value={purchase.discount} />
                <SummaryCard label="Grand Total" value={purchase.grand_total} bold />
                <SummaryCard label="Paid" value={purchase.amount_paid} />
            </div>

            {/* Supplier Info */}
            {supplier && (
                <div className="card p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Supplier Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <p className="text-slate-400 text-xs">Name</p>
                            <p className="font-medium text-slate-800">{supplier.name}</p>
                        </div>
                        {supplier.gstin && (
                            <div>
                                <p className="text-slate-400 text-xs">GSTIN</p>
                                <p className="font-mono text-slate-800">{supplier.gstin}</p>
                            </div>
                        )}
                        {supplier.phone && (
                            <div>
                                <p className="text-slate-400 text-xs">Phone</p>
                                <p className="text-slate-800">{supplier.phone}</p>
                            </div>
                        )}
                        {supplier.drug_license_no && (
                            <div>
                                <p className="text-slate-400 text-xs">Drug License</p>
                                <p className="text-slate-800">{supplier.drug_license_no}</p>
                            </div>
                        )}
                    </div>
                    {purchase.invoice_number && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
                            <span className="text-slate-400">Supplier Invoice: </span>
                            <span className="font-medium text-slate-800">{purchase.invoice_number}</span>
                            {purchase.invoice_date && <span className="text-slate-400"> dated {purchase.invoice_date}</span>}
                        </div>
                    )}
                </div>
            )}

            {/* Items Table */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Items ({items.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Expiry</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">Qty</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">Free</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">Rate</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">MRP</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">GST%</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">Disc%</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600">Received</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-800">{(item.medicines as any)?.name}</p>
                                        {(item.medicines as any)?.generic_name && (
                                            <p className="text-xs text-slate-400">{(item.medicines as any).generic_name}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{item.batch_number}</td>
                                    <td className="px-4 py-3 text-slate-600">{item.expiry_date}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{item.quantity_ordered}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{item.free_quantity || 0}</td>
                                    <td className="px-4 py-3 text-right text-slate-700">₹{Number(item.purchase_price).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{item.mrp ? `₹${Number(item.mrp).toFixed(2)}` : '—'}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{item.gst_rate}%</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{Number(item.discount_pct) > 0 ? `${item.discount_pct}%` : '—'}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800">₹{Number(item.line_total).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {item.quantity_received >= item.quantity_ordered ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Yes</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                {item.quantity_received}/{item.quantity_ordered}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {purchase.notes && (
                <div className="card p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Notes</h3>
                    <p className="text-sm text-slate-600">{purchase.notes}</p>
                </div>
            )}
        </div>
    )
}

function SummaryCard({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div className="card p-3 sm:p-4">
            <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
            <p className={`text-lg font-bold ${bold ? 'text-indigo-700' : 'text-slate-800'}`}>₹{Number(value).toFixed(2)}</p>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
        ordered: { label: 'Ordered', className: 'bg-blue-50 text-blue-700' },
        partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700' },
        received: { label: 'Received', className: 'bg-emerald-50 text-emerald-700' },
        cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}

function PaymentBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        unpaid: { label: 'Unpaid', className: 'bg-red-50 text-red-700' },
        partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700' },
        paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}
