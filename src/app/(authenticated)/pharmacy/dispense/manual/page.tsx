import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ManualDispenseForm from './ManualDispenseForm'

export default async function ManualDispensePage() {
    const { clinicId } = await requirePharmacyEnabled()
    const admin = createAdminClient()

    const { data: medicines } = await admin
        .from('medicines')
        .select('id, name')
        .eq('organization_id', clinicId)
        .eq('is_active', true)
        .order('name')

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center gap-3">
                <Link href="/pharmacy/dispense" className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manual Dispense</h1>
                    <p className="text-slate-500 text-sm">Dispense against a handwritten prescription</p>
                </div>
            </div>

            <ManualDispenseForm medicines={medicines || []} />
        </div>
    )
}
