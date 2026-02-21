import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import AppointmentList from './AppointmentList'

export const dynamic = 'force-dynamic'

export default async function AppointmentsPage() {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const admin = createAdminClient()

    const { data: appointments } = await admin
        .from('appointments')
        .select(`
            id,
            start_time,
            status,
            appointment_type,
            patients (
                full_name,
                gender,
                dob,
                phone
            ),
            doctors!inner(profile_id)
        `)
        .eq('doctors.profile_id', profile.id)
        .eq('clinic_id', clinicId)
        .order('start_time', { ascending: false })

    return <AppointmentList appointments={appointments || []} />
}
