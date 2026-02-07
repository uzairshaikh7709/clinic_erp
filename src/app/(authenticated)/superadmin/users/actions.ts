'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateUser(formData: FormData) {
    const admin = createAdminClient()

    const userId = formData.get('user_id') as string
    const fullName = formData.get('full_name') as string
    const isActive = formData.get('is_active') === 'true'

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
