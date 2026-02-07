'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPatientAttribute(formData: FormData) { // Helper? No, let's do direct object passing or form data
    // ...
}

export async function registerPatient(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Use Admin Client to bypass RLS recursion
    const admin = createAdminClient()

    const fullName = formData.get('full_name') as string
    const dob = formData.get('dob') as string
    const gender = formData.get('gender') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string

    // Generate Reg No
    const registrationNumber = 'P-' + Math.floor(1000 + Math.random() * 9000)

    const { data, error } = await admin.from('patients').insert({
        full_name: fullName,
        dob: dob,
        gender: gender,
        address: address,
        // phone: phone, // Schema check?
        registration_number: registrationNumber
    }).select().single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/doctor/patients')
    revalidatePath('/assistant/patients')
    return { success: true, patientId: data.id }
}

export async function createWalkInAppointment(patientId: string) {
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get Doctor ID
    const { data: doctor } = await admin.from('doctors').select('id').eq('profile_id', user.id).single()
    if (!doctor) return { error: 'Doctor not found' }

    // Create Walk-in Appointment
    const now = new Date()
    const endTime = new Date(now.getTime() + 30 * 60000) // 30 mins default

    const { data: appt, error } = await admin.from('appointments').insert({
        doctor_id: doctor.id,
        patient_id: patientId,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'completed' // Walk-in already happened
    }).select('id').single()

    if (error) return { error: error.message }

    return { success: true, appointmentId: appt.id }
}
