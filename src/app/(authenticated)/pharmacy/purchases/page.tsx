import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getPurchasesPaginated } from '../purchase-actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import Link from 'next/link'
import { Plus, ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUSES = [
    { key: '', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'ordered', label: 'Ordered' },
    { key: 'partial', label: 'Partial' },
    { key: 'received', label: 'Received' },
    { key: 'cancelled', label: 'Cancelled' },
]

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; supplier?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const status = params.status || ''
    const supplier = params.supplier || ''

    const { purchases, totalCount } = await getPurchasesPaginated(clinicId, page, status || undefined, supplier || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Purchases</h1>
                    <p className="text-slate-500 text-sm">{totalCount} purchase orders</p>
                </div>
                <Link href="/pharmacy/purchases/new" className="btn btn-primary text-sm">
                    <Plus size={16} className="mr-1.5" /> New Purchase
                </Link>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap">
                {STATUSES.map(f => (
                    <Link
                        key={f.key}
                        href={`/pharmacy/purchases${f.key ? `?status=${f.key}` : ''}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            status === f.key
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            <div className="card overflow-hidden">
                {purchases.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <ShoppingCart size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No purchases found</p>
                        <p className="text-sm mt-1">Create your first purchase order</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">PO Number</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Supplier</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Payment</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {purchases.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/purchases/${p.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                    {p.purchase_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{(p.suppliers as any)?.name || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{p.purchase_date}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">₹{Number(p.grand_total).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <PurchaseStatusBadge status={p.status} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <PaymentBadge status={p.payment_status} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/pharmacy/purchases/${p.id}`} className="text-indigo-600 hover:underline text-sm font-medium">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {purchases.map((p: any) => (
                                <Link key={p.id} href={`/pharmacy/purchases/${p.id}`} className="block p-4 hover:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">{p.purchase_number}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {(p.suppliers as any)?.name} &middot; {p.purchase_date}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-slate-800">₹{Number(p.grand_total).toFixed(2)}</p>
                                            <PurchaseStatusBadge status={p.status} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/purchases"
                            searchParams={{ ...(status ? { status } : {}), ...(supplier ? { supplier } : {}) }}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function PurchaseStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
        ordered: { label: 'Ordered', className: 'bg-blue-50 text-blue-700' },
        partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700' },
        received: { label: 'Received', className: 'bg-emerald-50 text-emerald-700' },
        cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}

function PaymentBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        unpaid: { label: 'Unpaid', className: 'bg-red-50 text-red-700' },
        partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700' },
        paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.className}`}>{c.label}</span>
}
