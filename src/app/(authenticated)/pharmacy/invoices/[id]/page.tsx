import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getInvoiceDetail } from '../../actions'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import InvoiceDetail from './InvoiceDetail'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { clinicId } = await requirePharmacyEnabled()

    const { invoice, items, payments } = await getInvoiceDetail(clinicId, id)

    if (!invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-lg font-bold text-slate-800">Invoice not found</h2>
                <Link href="/pharmacy/invoices" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">Back to Invoices</Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/pharmacy/invoices" className="text-slate-400 hover:text-slate-700">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{invoice.invoice_number}</h1>
                        <p className="text-slate-500 text-sm">{invoice.patient_name}</p>
                    </div>
                </div>
                <Link href={`/pharmacy/invoices/${id}/print`} className="btn btn-secondary text-sm">
                    <Printer size={16} className="mr-1" /> Print
                </Link>
            </div>

            <InvoiceDetail invoice={invoice} items={items} payments={payments} />
        </div>
    )
}
