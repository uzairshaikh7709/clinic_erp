'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/utils/auth'

export async function saveTemplate(data: any) {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id
    if (!doctorId) return { error: 'Doctor profile not found' }

    const admin = createAdminClient()

    try {
        const payload = {
            doctor_id: doctorId,
            name: data.name,
            medications: data.medications,
            clinic_id: clinicId,
        }

        let result
        if (data.id) {
            result = await admin
                .from('prescription_templates')
                .update(payload)
                .eq('id', data.id)
                .eq('clinic_id', clinicId)
                .select()
                .single()
        } else {
            result = await admin
                .from('prescription_templates')
                .insert(payload)
                .select()
                .single()
        }

        if (result.error) throw result.error

        revalidatePath('/doctor/templates')
        return { success: true, templateId: result.data.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to save template' }
    }
}

export async function deleteTemplate(id: string) {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id
    const admin = createAdminClient()

    try {
        const { data: template } = await admin
            .from('prescription_templates')
            .select('doctor_id')
            .eq('id', id)
            .eq('clinic_id', clinicId)
            .single()

        if (!template) return { error: 'Template not found' }

        if (!doctorId || template.doctor_id !== doctorId) {
            return { error: 'Unauthorized to delete this template' }
        }

        const { error } = await admin
            .from('prescription_templates')
            .delete()
            .eq('id', id)
            .eq('clinic_id', clinicId)

        if (error) throw error

        revalidatePath('/doctor/templates')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete template' }
    }
}
