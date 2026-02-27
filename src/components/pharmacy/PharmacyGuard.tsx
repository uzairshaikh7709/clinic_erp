import { getUserProfile } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

export async function requirePharmacyEnabled() {
    const profile = await getUserProfile()
    if (!profile) redirect('/login')

    const isAssistant = profile.role === 'assistant'
    const isOwnerDoctor = profile.role === 'doctor' && profile.is_clinic_owner

    if (!isAssistant && !isOwnerDoctor) {
        redirect(profile.role === 'doctor' ? '/doctor/dashboard' : '/login')
    }

    const clinicId = profile.clinic_id
    if (!clinicId) redirect('/login')

    const admin = createAdminClient()
    const { data: org } = await admin
        .from('organizations')
        .select('pharmacy_enabled')
        .eq('id', clinicId)
        .single()

    if (!org?.pharmacy_enabled) {
        redirect(profile.role === 'doctor' ? '/doctor/dashboard' : '/assistant/dashboard')
    }

    return { profile, clinicId }
}
