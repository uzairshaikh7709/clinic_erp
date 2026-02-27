import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import StockInForm from './StockInForm'

export default async function StockInPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { clinicId } = await requirePharmacyEnabled()
    const admin = createAdminClient()

    const { data: medicine } = await admin
        .from('medicines')
        .select('id, name, unit')
        .eq('id', id)
        .eq('organization_id', clinicId)
        .single()

    if (!medicine) {
        return (
            <div className="text-center py-12">
                <h2 className="text-lg font-bold text-slate-800">Medicine not found</h2>
                <Link href="/pharmacy/medicines" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">Back to Medicines</Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center gap-3">
                <Link href={`/pharmacy/medicines/${id}`} className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Stock In</h1>
                    <p className="text-slate-500 text-sm">{medicine.name}</p>
                </div>
            </div>
            <StockInForm medicineId={medicine.id} medicineName={medicine.name} unit={medicine.unit} />
        </div>
    )
}
