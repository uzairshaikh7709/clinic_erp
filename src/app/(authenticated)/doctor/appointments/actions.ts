'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireRole } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function cancelAppointment(appointmentId: string) {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const admin = createAdminClient()

    const { error } = await admin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('clinic_id', clinicId)

    if (error) return { error: error.message }

    revalidatePath('/doctor/appointments')
    revalidatePath('/doctor/dashboard')
    return { success: true }
}
