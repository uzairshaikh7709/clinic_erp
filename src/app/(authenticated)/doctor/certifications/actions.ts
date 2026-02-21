'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireDoctorWithClinic } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function saveCertificate(data: {
    id?: string
    patient_name: string
    age: string
    sex: string
    address?: string
    certificate_type: string
    description?: string
    date: string
}) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    try {
        let result
        if (data.id) {
            result = await admin
                .from('medical_certificates')
                .update({
                    patient_name: data.patient_name,
                    age: data.age,
                    sex: data.sex,
                    address: data.address || null,
                    certificate_type: data.certificate_type,
                    description: data.description || null,
                    date: data.date,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', data.id)
                .eq('doctor_id', doctor.doctor_id)
                .eq('clinic_id', doctor.clinic_id)
                .select()
                .single()
        } else {
            result = await admin
                .from('medical_certificates')
                .insert({
                    doctor_id: doctor.doctor_id,
                    clinic_id: doctor.clinic_id,
                    patient_name: data.patient_name,
                    age: data.age,
                    sex: data.sex,
                    address: data.address || null,
                    certificate_type: data.certificate_type,
                    description: data.description || null,
                    date: data.date,
                })
                .select()
                .single()
        }

        if (result.error) throw result.error

        revalidatePath('/doctor/certifications')
        revalidatePath(`/doctor/certifications/${result.data.id}`)
        return { success: true, certificateId: result.data.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to save certificate' }
    }
}

export async function deleteCertificate(id: string) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    try {
        const { error } = await admin
            .from('medical_certificates')
            .delete()
            .eq('id', id)
            .eq('doctor_id', doctor.doctor_id)
            .eq('clinic_id', doctor.clinic_id)

        if (error) throw error

        revalidatePath('/doctor/certifications')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete certificate' }
    }
}
