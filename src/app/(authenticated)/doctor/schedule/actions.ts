'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDoctorSlots() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()

    // Get Doctor ID
    const { data: doctor } = await admin
        .from('doctors')
        .select('id')
        .eq('profile_id', user.id)
        .single()

    if (!doctor) throw new Error('Doctor not found')

    // Get Slots
    const { data: slots } = await admin
        .from('doctor_slots')
        .select('*')
        .eq('doctor_id', doctor.id)
        .order('day_of_week')

    return { doctorId: doctor.id, slots: slots || [] }
}

export async function saveDoctorSlots(doctorId: string, slots: any[]) {
    const admin = createAdminClient()

    // Delete existing slots for this doctor
    const { error: deleteError } = await admin
        .from('doctor_slots')
        .delete()
        .eq('doctor_id', doctorId)

    if (deleteError) {
        console.error('Error deleting old slots:', deleteError)
        return { error: 'Failed to update schedule' }
    }

    // Insert new slots
    const cleanSlots = slots.map(s => ({
        doctor_id: doctorId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration: s.slot_duration,
        is_active: s.is_active
    }))

    const { error: insertError } = await admin
        .from('doctor_slots')
        .insert(cleanSlots)

    if (insertError) {
        console.error('Error inserting new slots:', insertError)
        return { error: insertError.message }
    }

    revalidatePath('/doctor/schedule')
    return { success: true }
}
