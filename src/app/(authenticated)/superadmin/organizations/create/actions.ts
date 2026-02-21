'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireRole } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const name = (formData.get('name') as string)?.trim()
    const slug = (formData.get('slug') as string)?.trim()
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const ownerProfileId = formData.get('owner_profile_id') as string

    if (!name || !slug) return { error: 'Name and slug are required' }

    try {
        const { data: org, error: orgError } = await admin
            .from('organizations')
            .insert({
                name,
                slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                address: address || null,
                phone: phone || null,
                email: email || null,
                owner_profile_id: ownerProfileId || null,
                is_active: true
            })
            .select()
            .single()

        if (orgError) throw orgError

        // Assign owner to this org if specified
        if (ownerProfileId) {
            await admin
                .from('profiles')
                .update({ clinic_id: org.id })
                .eq('id', ownerProfileId)

            await admin
                .from('doctors')
                .update({ clinic_id: org.id })
                .eq('profile_id', ownerProfileId)
        }

        revalidatePath('/superadmin/organizations')
        return { success: true, orgId: org.id }
    } catch (error: any) {
        console.error('Create org error:', error)
        if (error.code === '23505' || error.message?.includes('organizations_slug_key')) {
            return { error: 'This slug is already taken. Please choose a different one.' }
        }
        return { error: error.message || 'Failed to create organization' }
    }
}
