'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPatientAttribute(formData: FormData) {
    // ...
}

export async function registerPatient(prevState: any, formData: FormData) {
    const profile = await getUserProfile()
    if (!profile) return { error: 'Unauthorized' }

    const supabase = await createClient()

    // Fetch clinic_id directly via user's authenticated session (avoids admin key dependency)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', profile.id)
        .single()

    const clinicId = userProfile?.clinic_id
    if (!clinicId) return { error: 'No clinic assigned to your account' }

    const fullName = formData.get('full_name') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string

    // Generate Reg No
    const registrationNumber = 'P-' + Math.floor(1000 + Math.random() * 9000)

    const { data, error } = await supabase.from('patients').insert({
        full_name: fullName,
        age: age ? parseInt(age) : null,
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

export async function deletePatient(patientId: string) {
    const profile = await getUserProfile()
    if (!profile) return { error: 'Unauthorized' }
    const clinicId = profile.clinic_id!

    const admin = createAdminClient()

    // Delete related records first (appointments, prescriptions)
    await Promise.all([
        admin.from('appointments').delete().eq('patient_id', patientId).eq('clinic_id', clinicId),
        admin.from('prescriptions').delete().eq('patient_id', patientId).eq('clinic_id', clinicId),
    ])

    const { error } = await admin
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('clinic_id', clinicId)

    if (error) return { error: error.message }

    revalidatePath('/doctor/patients')
    revalidatePath('/assistant/patients')
    return { success: true }
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
