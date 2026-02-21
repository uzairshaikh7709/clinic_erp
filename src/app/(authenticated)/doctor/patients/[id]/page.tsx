import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import PatientDetail from './PatientDetail'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id!
    const admin = createAdminClient()

    const [{ data: patient }, { data: prescriptions }] = await Promise.all([
        admin
            .from('patients')
            .select('id, full_name, dob, gender, phone, address, registration_number, created_at')
            .eq('id', id)
            .eq('clinic_id', clinicId)
            .single(),
        admin
            .from('prescriptions')
            .select(`
                id,
                created_at,
                diagnosis,
                medications,
                history,
                advice,
                follow_up_date,
                appointments (start_time, appointment_type)
            `)
            .eq('patient_id', id)
            .eq('doctor_id', doctorId)
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false }),
    ])

    if (!patient) notFound()

    return <PatientDetail patient={patient} prescriptions={prescriptions || []} />
}
