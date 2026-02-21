import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import CertificateView from './CertificateView'

export default async function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const [{ data: cert }, { data: doctorRecord }] = await Promise.all([
        admin
            .from('medical_certificates')
            .select('*')
            .eq('id', id)
            .eq('doctor_id', doctor.doctor_id)
            .eq('clinic_id', doctor.clinic_id)
            .single(),
        admin
            .from('doctors')
            .select('specialization, registration_number')
            .eq('id', doctor.doctor_id)
            .single(),
    ])

    if (!cert) notFound()

    return (
        <CertificateView
            cert={cert}
            doctorName={doctor.full_name || 'Doctor'}
            specialization={doctorRecord?.specialization || ''}
            registrationNumber={doctorRecord?.registration_number || ''}
        />
    )
}
