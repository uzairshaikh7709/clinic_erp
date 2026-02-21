'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireRole, getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

const PROTECTED_EMAIL = 'sadik5780@gmail.com'

async function isProtectedUser(admin: ReturnType<typeof createAdminClient>, userId: string) {
    const { data } = await admin
        .from('profiles')
        .select('email, role')
        .eq('id', userId)
        .single()
    return data?.email === PROTECTED_EMAIL || data?.role === 'superadmin'
}

export async function updateUser(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const userId = formData.get('user_id') as string
    const fullName = (formData.get('full_name') as string)?.trim()
    const isActive = formData.get('is_active') === 'true'

    if (!userId || !fullName) return { error: 'Missing required fields' }

    // Prevent deactivating protected system admin
    if (!isActive && await isProtectedUser(admin, userId)) {
        return { error: 'System admin account cannot be deactivated' }
    }

    try {
        const { error } = await admin
            .from('profiles')
            .update({
                full_name: fullName,
                is_active: isActive
            })
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/superadmin/users')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update user' }
    }
}

export async function resetUserPassword(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const userId = formData.get('user_id') as string
    const newPassword = formData.get('new_password') as string

    if (!userId || !newPassword) return { error: 'Missing required fields' }
    if (newPassword.length < 8) return { error: 'Password must be at least 8 characters' }

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

export async function softDeleteUser(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const userId = formData.get('user_id') as string
    if (!userId) return { error: 'Missing user ID' }

    // Prevent self-deactivation
    const profile = await getUserProfile()
    if (profile?.id === userId) return { error: 'You cannot deactivate your own account' }

    // Prevent deactivating protected system admin
    if (await isProtectedUser(admin, userId)) {
        return { error: 'System admin account cannot be deactivated' }
    }

    try {
        const { error } = await admin
            .from('profiles')
            .update({ is_active: false })
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/superadmin/users')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to deactivate user' }
    }
}
