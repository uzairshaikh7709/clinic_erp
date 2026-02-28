import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getSupplierDetail } from '../../purchase-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, IndianRupee, ShoppingCart, RotateCcw } from 'lucide-react'
import SupplierForm from '../SupplierForm'
import SupplierActions from './SupplierActions'

export const dynamic = 'force-dynamic'

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const { id } = await params
    const { supplier, purchases, returns, ledger } = await getSupplierDetail(clinicId, id)

    if (!supplier) notFound()

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex items-center gap-3">
                <Link href="/pharmacy/suppliers" className="btn btn-ghost text-sm">
                    <ArrowLeft size={16} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{supplier.name}</h1>
                    <p className="text-slate-500 text-sm">
                        {supplier.gstin && <span className="font-mono">{supplier.gstin}</span>}
                        {supplier.drug_license_no && <span> &middot; DL: {supplier.drug_license_no}</span>}
                    </p>
                </div>
                <SupplierActions supplier={supplier} />
            </div>

            {/* Ledger Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <LedgerCard label="Total Purchases" value={ledger.total_purchased} />
                <LedgerCard label="Total Paid" value={ledger.total_paid} />
                <LedgerCard label="Returns" value={ledger.total_returned} />
                <LedgerCard label="Outstanding" value={ledger.outstanding} highlight={ledger.outstanding > 0} />
            </div>

            {/* Recent Purchases */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={18} className="text-indigo-400" />
                        <h3 className="font-bold text-slate-800">Purchase History</h3>
                    </div>
                    <Link href={`/pharmacy/purchases?supplier=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">View All</Link>
                </div>
                {purchases.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No purchases yet</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {purchases.map((p: any) => (
                            <Link key={p.id} href={`/pharmacy/purchases/${p.id}`} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800">{p.purchase_number}</p>
                                    <p className="text-xs text-slate-400">{p.purchase_date}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-slate-800">₹{Number(p.grand_total).toFixed(2)}</p>
                                    <PurchaseStatusBadge status={p.status} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Returns */}
            {returns.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                        <RotateCcw size={18} className="text-amber-400" />
                        <h3 className="font-bold text-slate-800">Purchase Returns</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {returns.map((r: any) => (
                            <div key={r.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{r.return_number}</p>
                                    <p className="text-xs text-slate-400">{r.return_date} &middot; {r.reason}</p>
                                </div>
                                <p className="text-sm font-bold text-red-600">-₹{Number(r.grand_total).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Form */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Edit Supplier Details</h2>
                <SupplierForm supplier={supplier} />
            </div>
        </div>
    )
}

function LedgerCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className="card p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">{label}</p>
            <p className={`text-lg sm:text-xl font-bold ${highlight ? 'text-red-600' : 'text-slate-900'}`}>
                ₹{Number(value).toFixed(2)}
            </p>
        </div>
    )
}

function PurchaseStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'bg-slate-50 text-slate-600' },
        ordered: { label: 'Ordered', className: 'bg-blue-50 text-blue-700' },
        partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700' },
        received: { label: 'Received', className: 'bg-emerald-50 text-emerald-700' },
        cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-50 text-slate-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}
