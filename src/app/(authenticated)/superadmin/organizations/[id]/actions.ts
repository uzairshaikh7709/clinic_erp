'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireRole } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function updateOrganization(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const orgId = formData.get('org_id') as string
    const name = (formData.get('name') as string)?.trim()
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const isActive = formData.get('is_active') === 'true'

    if (!orgId || !name) throw new Error('Organization name is required')

    const { error } = await admin
        .from('organizations')
        .update({
            name,
            address: address || null,
            phone: phone || null,
            email: email || null,
            is_active: isActive,
            updated_at: new Date().toISOString()
        })
        .eq('id', orgId)

    if (error) throw new Error(error.message)

    revalidatePath(`/superadmin/organizations/${orgId}`)
    revalidatePath('/superadmin/organizations')
}

export async function addMemberToOrg(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const orgId = formData.get('org_id') as string
    const profileId = formData.get('profile_id') as string

    if (!orgId || !profileId) return { error: 'Missing required fields' }

    try {
        const { error } = await admin
            .from('profiles')
            .update({ clinic_id: orgId })
            .eq('id', profileId)

        if (error) throw error

        await Promise.all([
            admin.from('doctors').update({ clinic_id: orgId }).eq('profile_id', profileId),
            admin.from('assistants').update({ clinic_id: orgId }).eq('profile_id', profileId)
        ])

        revalidatePath(`/superadmin/organizations/${orgId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to add member' }
    }
}

export async function removeMemberFromOrg(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const profileId = formData.get('profile_id') as string
    const orgId = formData.get('org_id') as string

    if (!profileId || !orgId) return { error: 'Missing required fields' }

    try {
        await Promise.all([
            admin.from('profiles').update({ clinic_id: null }).eq('id', profileId),
            admin.from('doctors').update({ clinic_id: null }).eq('profile_id', profileId),
            admin.from('assistants').update({ clinic_id: null }).eq('profile_id', profileId)
        ])

        revalidatePath(`/superadmin/organizations/${orgId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to remove member' }
    }
}

export async function deleteOrganization(orgId: string) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    if (!orgId) return { error: 'Missing organization ID' }

    try {
        // Check if org has any members
        const { data: members } = await admin
            .from('profiles')
            .select('id')
            .eq('clinic_id', orgId)
            .limit(1)

        if (members && members.length > 0) {
            return { error: 'Cannot delete organization with members. Remove all members first.' }
        }

        const { error } = await admin
            .from('organizations')
            .delete()
            .eq('id', orgId)

        if (error) return { error: error.message }

        revalidatePath('/superadmin/organizations')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete organization' }
    }
}

export async function createUserForOrg(formData: FormData) {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const orgId = formData.get('org_id') as string
    const email = (formData.get('email') as string)?.trim()?.toLowerCase()
    const password = formData.get('password') as string
    const fullName = (formData.get('full_name') as string)?.trim()
    const role = formData.get('role') as string

    if (!orgId || !email || !password || !fullName || !role) return { error: 'All fields are required' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters' }
    if (!['doctor', 'assistant'].includes(role)) return { error: 'Invalid role' }

    try {
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role, clinic_id: orgId }
        })

        if (authError) throw authError

        const userId = authData.user.id

        const { error: profileError } = await admin.from('profiles').insert({
            id: userId,
            email,
            full_name: fullName,
            role: role as any,
            is_active: true,
            clinic_id: orgId
        })

        if (profileError) throw profileError

        if (role === 'doctor') {
            const registrationNumber = (formData.get('registration_number') as string)?.trim()
            const specialization = (formData.get('specialization') as string)?.trim()

            const { error: doctorError } = await admin.from('doctors').insert({
                profile_id: userId,
                registration_number: registrationNumber || null,
                specialization: specialization || null,
                clinic_id: orgId
            })

            if (doctorError) throw doctorError
        }

        if (role === 'assistant') {
            const assignedDoctorId = formData.get('assigned_doctor_id') as string

            const { error: assistantError } = await admin.from('assistants').insert({
                profile_id: userId,
                assigned_doctor_id: assignedDoctorId || null,
                clinic_id: orgId
            })

            if (assistantError) throw assistantError
        }

        revalidatePath(`/superadmin/organizations/${orgId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to create user' }
    }
}
