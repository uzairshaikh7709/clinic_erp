'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireClinicOwner } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function createStaffMember(formData: FormData) {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()
    const clinicId = owner.clinic_id

    const email = (formData.get('email') as string)?.trim()?.toLowerCase()
    const password = formData.get('password') as string
    const fullName = (formData.get('full_name') as string)?.trim()
    const role = formData.get('role') as string

    if (!email || !password || !fullName || !role) return { error: 'All fields are required' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters' }
    if (!['doctor', 'assistant'].includes(role)) return { error: 'Invalid role. Only doctor or assistant allowed.' }

    try {
        // Create auth user
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role, clinic_id: clinicId }
        })

        if (authError) throw authError

        const userId = authData.user.id

        // Create profile
        const { error: profileError } = await admin.from('profiles').insert({
            id: userId,
            email,
            full_name: fullName,
            role: role as any,
            is_active: true,
            clinic_id: clinicId
        })

        if (profileError) throw profileError

        // Create role-specific record
        if (role === 'doctor') {
            const registrationNumber = (formData.get('registration_number') as string)?.trim()
            const specialization = (formData.get('specialization') as string)?.trim()

            if (!registrationNumber || !specialization) return { error: 'Registration number and specialization are required for doctors' }

            const { error: doctorError } = await admin.from('doctors').insert({
                profile_id: userId,
                registration_number: registrationNumber,
                specialization,
                clinic_id: clinicId
            })

            if (doctorError) throw doctorError
        }

        if (role === 'assistant') {
            const assignedDoctorId = formData.get('assigned_doctor_id') as string

            const { error: assistantError } = await admin.from('assistants').insert({
                profile_id: userId,
                assigned_doctor_id: assignedDoctorId || null,
                clinic_id: clinicId
            })

            if (assistantError) throw assistantError
        }

        revalidatePath('/doctor/team')
        return { success: true }
    } catch (error: any) {
        console.error('Create staff error:', error)
        return { error: error.message || 'Failed to create staff member' }
    }
}
