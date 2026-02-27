import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getInvoiceDetail } from '../../../actions'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import InvoicePrint from './InvoicePrint'

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { clinicId } = await requirePharmacyEnabled()
    const admin = createAdminClient()

    const [{ invoice, items, payments }, { data: org }] = await Promise.all([
        getInvoiceDetail(clinicId, id),
        admin.from('organizations').select('name, phone, address, email').eq('id', clinicId).single(),
    ])

    if (!invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-lg font-bold text-slate-800">Invoice not found</h2>
                <Link href="/pharmacy/invoices" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">Back to Invoices</Link>
            </div>
        )
    }

    return <InvoicePrint invoice={invoice} items={items} payments={payments} org={org} />
}
