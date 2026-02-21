import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import CertificateList from './CertificateList'

export default async function CertificationsPage() {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const { data: certificates } = await admin
        .from('medical_certificates')
        .select('id, patient_name, age, sex, certificate_type, date, created_at')
        .eq('doctor_id', doctor.doctor_id)
        .eq('clinic_id', doctor.clinic_id)
        .order('created_at', { ascending: false })

    return <CertificateList certificates={certificates || []} />
}
