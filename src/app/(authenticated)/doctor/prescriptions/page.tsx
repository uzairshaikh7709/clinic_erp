import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import PrescriptionListActions from './PrescriptionListActions'
import PrescriptionSearch from './PrescriptionSearch'

export default async function PrescriptionsPage({ searchParams }: { searchParams: Promise<{ patient?: string }> }) {
    const { patient: patientFilter } = await searchParams
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id!
    const supabase = createAdminClient()

    if (!doctorId) return <div>Doctor profile not found.</div>

    let query = supabase
        .from('prescriptions')
        .select(`
            id,
            created_at,
            diagnosis,
            patient_id,
            patients (full_name, gender),
            appointments (start_time)
        `)
        .eq('doctor_id', doctorId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })

    // Filter by patient if provided from "History" link
    if (patientFilter) {
        query = query.eq('patient_id', patientFilter)
    }

    const { data: prescriptions } = await query

    // Get patient name if filtering
    let filterPatientName: string | null = null
    if (patientFilter && prescriptions && prescriptions.length > 0) {
        filterPatientName = (prescriptions[0] as any).patients?.full_name || null
    }

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                        {filterPatientName ? `Prescriptions for ${filterPatientName}` : 'Prescriptions'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {filterPatientName ? (
                            <Link href="/doctor/prescriptions" className="text-[#0077B6] hover:underline">
                                View all prescriptions
                            </Link>
                        ) : 'Manage patient prescriptions and records'}
                    </p>
                </div>
            </div>

            <PrescriptionSearch prescriptions={prescriptions || []} />
        </div>
    )
}
