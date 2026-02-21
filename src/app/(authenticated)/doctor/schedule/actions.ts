'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function getDoctorSlots() {
    const profile = await getUserProfile()
    if (!profile) throw new Error('Unauthorized')
    const doctorId = profile.doctor_id
    if (!doctorId) throw new Error('Doctor not found')
    if (!profile.clinic_id) throw new Error('Not assigned to a clinic')

    const admin = createAdminClient()

    const { data: slots } = await admin
        .from('doctor_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('clinic_id', profile.clinic_id)
        .order('day_of_week')

    return { doctorId, slots: slots || [] }
}

export async function saveDoctorSlots(_doctorId: string, slots: any[]) {
    const profile = await getUserProfile()
    if (!profile) return { error: 'Unauthorized' }
    if (!profile.doctor_id) return { error: 'Doctor not found' }
    if (!profile.clinic_id) return { error: 'Not assigned to a clinic' }

    const doctorId = profile.doctor_id
    const clinicId = profile.clinic_id
    const admin = createAdminClient()

    // Delete existing slots for this doctor
    const { error: deleteError } = await admin
        .from('doctor_slots')
        .delete()
        .eq('doctor_id', doctorId)
        .eq('clinic_id', clinicId)

    if (deleteError) {
        console.error('Error deleting old slots:', deleteError)
        return { error: 'Failed to update schedule: ' + deleteError.message }
    }

    // Insert new slots
    const cleanSlots = slots.map(s => ({
        doctor_id: doctorId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration: s.slot_duration,
        is_active: s.is_active,
        clinic_id: clinicId
    }))

    const { error: insertError } = await admin
        .from('doctor_slots')
        .insert(cleanSlots)

    if (insertError) {
        console.error('Error inserting new slots:', insertError)
        return { error: 'Failed to save schedule: ' + insertError.message }
    }

    revalidatePath('/doctor/schedule')
    return { success: true }
}
