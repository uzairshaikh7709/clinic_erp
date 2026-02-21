'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireRole } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function deleteContactSubmission(id: string) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const { error } = await admin
        .from('contact_submissions')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/superadmin/contacts')
    return { success: true }
}
