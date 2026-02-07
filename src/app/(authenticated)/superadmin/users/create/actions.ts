'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
    const admin = createAdminClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const role = formData.get('role') as string

    try {
        // Create auth user via Supabase Admin API
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: role }
        })

        if (authError) throw authError

        const userId = authData.user.id

        // Create profile
        const { error: profileError } = await admin.from('profiles').insert({
            id: userId,
            email,
            full_name: fullName,
            role: role as any,
            is_active: true
        })

        if (profileError) throw profileError

        // Create role-specific records
        if (role === 'doctor') {
            const registrationNumber = formData.get('registration_number') as string
            const specialization = formData.get('specialization') as string

            const { error: doctorError } = await admin.from('doctors').insert({
                profile_id: userId,
                registration_number: registrationNumber,
                specialization
            })

            if (doctorError) throw doctorError
        }

        if (role === 'assistant') {
            const assignedDoctorId = formData.get('assigned_doctor_id') as string

            const { error: assistantError } = await admin.from('assistants').insert({
                profile_id: userId,
                assigned_doctor_id: assignedDoctorId || null
            })

            if (assistantError) throw assistantError
        }

        revalidatePath('/superadmin/users')
        return { success: true }
    } catch (error: any) {
        console.error('Create user error:', error)
        return { error: error.message || 'Failed to create user' }
    }
}
