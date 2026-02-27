import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getInvoicesPaginated } from '../actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import Link from 'next/link'
import { Receipt, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = [
    { key: '', label: 'All' },
    { key: 'unpaid', label: 'Unpaid' },
    { key: 'partial', label: 'Partial' },
    { key: 'paid', label: 'Paid' },
]

const STATUS_BADGE: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700',
    partial: 'bg-amber-50 text-amber-700',
    unpaid: 'bg-red-50 text-red-700',
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const status = params.status || ''

    const { invoices, totalCount } = await getInvoicesPaginated(clinicId, page, status || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Invoices</h1>
                    <p className="text-slate-500 text-sm">{totalCount} total invoice{totalCount !== 1 ? 's' : ''}</p>
                </div>
                <Link href="/pharmacy/invoices/new" className="btn btn-primary text-sm">
                    <Plus size={16} className="mr-1" /> New Invoice
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map(f => (
                    <Link
                        key={f.key}
                        href={`/pharmacy/invoices${f.key ? `?status=${f.key}` : ''}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                {invoices.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Receipt size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No invoices found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Invoice #</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Patient</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Doctor</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:underline">
                                                    {inv.invoice_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-800">{inv.patient_name}</td>
                                            <td className="px-4 py-3 text-slate-500">{inv.doctor_name || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                ₹{Number(inv.grand_total).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[inv.payment_status] || 'bg-slate-50 text-slate-600'}`}>
                                                    {inv.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                {new Date(inv.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {invoices.map((inv: any) => (
                                <Link key={inv.id} href={`/pharmacy/invoices/${inv.id}`} className="block p-4 hover:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-indigo-600">{inv.invoice_number}</p>
                                            <p className="text-sm text-slate-800 truncate">{inv.patient_name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {new Date(inv.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-slate-800">₹{Number(inv.grand_total).toFixed(2)}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${STATUS_BADGE[inv.payment_status] || 'bg-slate-50 text-slate-600'}`}>
                                                {inv.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/invoices"
                            searchParams={status ? { status } : {}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
