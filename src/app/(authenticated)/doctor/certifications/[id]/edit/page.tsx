import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import CertificateForm from '../../CertificateForm'

export default async function EditCertificatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const { data: cert } = await admin
        .from('medical_certificates')
        .select('id, patient_name, age, sex, address, certificate_type, description, date')
        .eq('id', id)
        .eq('doctor_id', doctor.doctor_id)
        .eq('clinic_id', doctor.clinic_id)
        .single()

    if (!cert) notFound()

    return (
        <CertificateForm
            initialData={{
                id: cert.id,
                patient_name: cert.patient_name,
                age: cert.age,
                sex: cert.sex,
                address: cert.address || '',
                certificate_type: cert.certificate_type,
                description: cert.description || '',
                date: cert.date,
            }}
        />
    )
}
