'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function saveAvailability(formData: FormData) {
    const profile = await getUserProfile()
    if (!profile) return { error: 'Unauthorized' }
    if (!profile.doctor_id) return { error: 'Doctor not found' }
    if (!profile.clinic_id) return { error: 'Not assigned to a clinic' }

    const doctorId = profile.doctor_id
    const clinicId = profile.clinic_id
    const admin = createAdminClient()

    const days = formData.getAll('days') as string[] // ['0', '1', ...] for Sun-Sat
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const slotDuration = parseInt(formData.get('slot_duration') as string)

    // Delete existing slots for this doctor
    await admin
        .from('doctor_slots')
        .delete()
        .eq('doctor_id', doctorId)
        .eq('clinic_id', clinicId)

    // Create new slots for selected days
    const slotsToInsert = days.map(day => ({
        doctor_id: doctorId,
        day_of_week: parseInt(day),
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        is_active: true,
        clinic_id: clinicId
    }))

    if (slotsToInsert.length > 0) {
        const { error } = await admin
            .from('doctor_slots')
            .insert(slotsToInsert)

        if (error) return { error: error.message }
    }

    revalidatePath('/doctor/availability')
    return { success: true }
}
