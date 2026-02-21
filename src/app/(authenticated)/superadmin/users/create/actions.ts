'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireRole } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const email = (formData.get('email') as string)?.trim()?.toLowerCase()
    const password = formData.get('password') as string
    const fullName = (formData.get('full_name') as string)?.trim()
    const role = formData.get('role') as string
    const clinicId = formData.get('clinic_id') as string

    if (!email || !password || !fullName || !role) return { error: 'All fields are required' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters' }
    if (!['superadmin', 'doctor', 'assistant', 'patient'].includes(role)) return { error: 'Invalid role' }
    if (role !== 'superadmin' && !clinicId) return { error: 'Organization is required for non-admin roles' }

    try {
        // Create auth user via Supabase Admin API
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role, clinic_id: role !== 'superadmin' ? clinicId : null }
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
            clinic_id: role !== 'superadmin' ? clinicId : null
        })

        if (profileError) throw profileError

        // Create role-specific records
        if (role === 'doctor') {
            const registrationNumber = formData.get('registration_number') as string
            const specialization = formData.get('specialization') as string

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

        revalidatePath('/superadmin/users')
        return { success: true }
    } catch (error: any) {
        console.error('Create user error:', error)
        return { error: error.message || 'Failed to create user' }
    }
}
