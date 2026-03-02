import { requireRole } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import AssistantPatientList from './AssistantPatientList'

export default async function AssistantPatientsPage() {
    const profile = await requireRole(['assistant'])
    const clinicId = profile.clinic_id
    const supabase = await createClient()

    if (!clinicId) return <div className="p-12 text-center text-slate-500">No clinic assigned.</div>

    const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name, age, gender, phone, address, registration_number, created_at')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Patient Registry</h1>
                <Link href="/assistant/patients/new" className="btn btn-primary shadow-lg shadow-blue-500/20 text-sm flex-shrink-0">
                    <Plus size={16} className="mr-1.5" /> Add Patient
                </Link>
            </div>

            <AssistantPatientList patients={patients ?? []} />
        </div>
    )
}
