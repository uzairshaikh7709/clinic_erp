import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ManualInvoiceForm from './ManualInvoiceForm'

export default async function NewInvoicePage() {
    const { clinicId } = await requirePharmacyEnabled()
    const admin = createAdminClient()

    // Fetch active medicines for suggestions
    const { data: medicines } = await admin
        .from('medicines')
        .select('id, name')
        .eq('organization_id', clinicId)
        .eq('is_active', true)
        .order('name')

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center gap-3">
                <Link href="/pharmacy/invoices" className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">New Invoice</h1>
                    <p className="text-slate-500 text-sm">Create a manual invoice for walk-in sales</p>
                </div>
            </div>

            <ManualInvoiceForm medicines={medicines || []} />
        </div>
    )
}
