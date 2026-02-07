'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAvailability(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const admin = createAdminClient()

    // Get doctor ID
    const { data: doctor } = await admin
        .from('doctors')
        .select('id')
        .eq('profile_id', user.id)
        .single()

    if (!doctor) return { error: 'Doctor not found' }

    const days = formData.getAll('days') as string[] // ['0', '1', ...] for Sun-Sat
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const slotDuration = parseInt(formData.get('slot_duration') as string)

    // Delete existing slots for this doctor
    await admin
        .from('doctor_slots')
        .delete()
        .eq('doctor_id', doctor.id)

    // Create new slots for selected days
    const slotsToInsert = days.map(day => ({
        doctor_id: doctor.id,
        day_of_week: parseInt(day),
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        is_active: true
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
