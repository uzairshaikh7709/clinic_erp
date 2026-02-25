'use server'

import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveSignature(formData: FormData) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const signatureUrl = (formData.get('signature_url') as string)?.trim() || null

    const { error } = await admin
        .from('doctors')
        .update({ signature_url: signatureUrl })
        .eq('id', doctor.doctor_id)

    if (error) return { error: 'Failed to save signature' }

    revalidatePath('/doctor/settings')
    revalidatePath('/doctor/prescriptions')
    revalidatePath('/doctor/certifications')
    return { success: true }
}
