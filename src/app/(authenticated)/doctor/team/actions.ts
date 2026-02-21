'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireClinicOwner } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

const PROTECTED_EMAIL = 'sadik5780@gmail.com'

export async function resetStaffPassword(formData: FormData) {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    const userId = formData.get('user_id') as string
    const newPassword = formData.get('new_password') as string

    if (!userId || !newPassword) return { error: 'Missing required fields' }
    if (newPassword.length < 8) return { error: 'Password must be at least 8 characters' }
    if (userId === owner.id) return { error: 'You cannot reset your own password from here' }

    // Verify target belongs to same clinic
    const { data: target } = await admin
        .from('profiles')
        .select('clinic_id, email')
        .eq('id', userId)
        .single()

    if (!target || target.clinic_id !== owner.clinic_id) {
        return { error: 'User does not belong to your clinic' }
    }

    if (target.email === PROTECTED_EMAIL) return { error: 'System admin account cannot be modified' }

    try {
        const { error } = await admin.auth.admin.updateUserById(userId, {
            password: newPassword,
        })

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to reset password' }
    }
}

export async function toggleStaffStatus(formData: FormData) {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    const userId = formData.get('user_id') as string
    const isActive = formData.get('is_active') === 'true'

    if (!userId) return { error: 'Missing user ID' }
    if (userId === owner.id) return { error: 'You cannot disable your own account' }

    // Verify target belongs to same clinic
    const { data: target } = await admin
        .from('profiles')
        .select('clinic_id')
        .eq('id', userId)
        .single()

    if (!target || target.clinic_id !== owner.clinic_id) {
        return { error: 'User does not belong to your clinic' }
    }

    // Protect system admin
    if (!isActive) {
        const { data: profile } = await admin.from('profiles').select('email').eq('id', userId).single()
        if (profile?.email === PROTECTED_EMAIL) return { error: 'System admin account cannot be modified' }
    }

    const { error } = await admin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/doctor/team')
    return { success: true }
}

export async function removeStaffFromClinic(formData: FormData) {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    const profileId = formData.get('profile_id') as string

    if (!profileId) return { error: 'Missing profile ID' }
    if (profileId === owner.id) return { error: 'You cannot remove yourself from the clinic' }

    // Verify target belongs to same clinic
    const { data: target } = await admin
        .from('profiles')
        .select('clinic_id')
        .eq('id', profileId)
        .single()

    if (!target || target.clinic_id !== owner.clinic_id) {
        return { error: 'User does not belong to your clinic' }
    }

    // Protect system admin
    const { data: profile } = await admin.from('profiles').select('email').eq('id', profileId).single()
    if (profile?.email === PROTECTED_EMAIL) return { error: 'System admin account cannot be removed' }

    // Clear clinic_id from profile + role-specific tables
    await Promise.all([
        admin.from('profiles').update({ clinic_id: null }).eq('id', profileId),
        admin.from('doctors').update({ clinic_id: null }).eq('profile_id', profileId),
        admin.from('assistants').update({ clinic_id: null }).eq('profile_id', profileId)
    ])

    revalidatePath('/doctor/team')
    return { success: true }
}

export async function deleteStaffMember(formData: FormData) {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    const profileId = formData.get('profile_id') as string

    if (!profileId) return { error: 'Missing profile ID' }
    if (profileId === owner.id) return { error: 'You cannot delete your own account' }

    // Verify target belongs to same clinic
    const { data: target } = await admin
        .from('profiles')
        .select('clinic_id, role')
        .eq('id', profileId)
        .single()

    if (!target || target.clinic_id !== owner.clinic_id) {
        return { error: 'User does not belong to your clinic' }
    }

    // Protect system admin
    const { data: profile } = await admin.from('profiles').select('email').eq('id', profileId).single()
    if (profile?.email === PROTECTED_EMAIL) return { error: 'System admin account cannot be deleted' }

    try {
        // Remove from role-specific tables first
        await Promise.all([
            admin.from('doctors').delete().eq('profile_id', profileId),
            admin.from('assistants').delete().eq('profile_id', profileId),
        ])

        // Deactivate and remove from clinic
        await admin
            .from('profiles')
            .update({ is_active: false, clinic_id: null })
            .eq('id', profileId)

        // Delete from Supabase Auth
        await admin.auth.admin.deleteUser(profileId)

        revalidatePath('/doctor/team')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete staff member' }
    }
}
