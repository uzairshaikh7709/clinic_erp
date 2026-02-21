'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPatientAttribute(formData: FormData) {
    // ...
}

export async function registerPatient(prevState: any, formData: FormData) {
    const profile = await getUserProfile()
    if (!profile) return { error: 'Unauthorized' }
    const clinicId = profile.clinic_id!

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
        phone: phone,
        registration_number: registrationNumber,
        clinic_id: clinicId
    }).select().single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/doctor/patients')
    revalidatePath('/assistant/patients')
    return { success: true, patientId: data.id }
}

export async function createWalkInAppointment(patientId: string) {
    const profile = await getUserProfile()
    if (!profile) return { error: 'Unauthorized' }
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id
    if (!doctorId) return { error: 'Doctor not found' }

    const admin = createAdminClient()

    // Create Walk-in Appointment
    const now = new Date()
    const endTime = new Date(now.getTime() + 30 * 60000) // 30 mins default

    const { data: appt, error } = await admin.from('appointments').insert({
        doctor_id: doctorId,
        patient_id: patientId,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'completed',
        appointment_type: 'walk_in',
        clinic_id: clinicId
    }).select('id').single()

    if (error) return { error: error.message }

    return { success: true, appointmentId: appt.id }
}
