'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function savePrescription(data: any) {
    const admin = createAdminClient()

    try {
        let result
        if (data.id) {
            // Update existing prescription
            result = await admin
                .from('prescriptions')
                .update({
                    medications: data.medications,
                    history: data.history,
                    examinations: data.examinations,
                    diagnosis: data.diagnosis,
                    investigations: data.investigations,
                    advice: data.advice,
                    follow_up_date: data.follow_up_date
                })
                .eq('id', data.id)
                .select()
                .single()
        } else {
            // Create new prescription
            result = await admin
                .from('prescriptions')
                .insert({
                    appointment_id: data.appointment_id,
                    doctor_id: data.doctor_id,
                    patient_id: data.patient_id,
                    medications: data.medications,
                    history: data.history,
                    examinations: data.examinations,
                    diagnosis: data.diagnosis,
                    investigations: data.investigations,
                    advice: data.advice,
                    follow_up_date: data.follow_up_date
                })
                .select()
                .single()

            // Mark appointment as Completed only on creation
            if (!result.error && data.appointment_id) {
                await admin
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', data.appointment_id)
            }
        }

        if (result.error) throw result.error

        revalidatePath('/doctor/prescriptions')
        revalidatePath(`/doctor/prescriptions/${result.data.id}`)
        return { success: true, prescriptionId: result.data.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to save prescription' }
    }
}

export async function deletePrescription(id: string) {
    const admin = createAdminClient()

    try {
        const { error } = await admin
            .from('prescriptions')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/doctor/prescriptions')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete prescription' }
    }
}
