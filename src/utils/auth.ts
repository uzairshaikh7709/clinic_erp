'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'
import type { UserProfile } from '@/types/database'

// Cached helper to get current user profile safely.
// Uses getSession() (reads JWT from cookie locally, no network call) instead of
// getUser() (which makes a round-trip to Supabase auth servers on every request).
// The middleware already handles token refresh via getSession().
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return null

    const admin = createAdminClient()

    // Fetch profile + role-specific ID in parallel
    const userId = session.user.id
    const { data: profile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!profile) return null

    // Resolve role-specific IDs + ownership + clinic name in parallel
    let doctor_id: string | null = null
    let assistant_id: string | null = null
    let assigned_doctor_id: string | null = null
    let is_clinic_owner = false
    let clinic_name: string | null = null

    if (profile.role === 'doctor') {
        // Fire doctor lookup + ownership check + clinic name in parallel
        const [doctorResult, ownershipResult, clinicResult] = await Promise.all([
            admin.from('doctors').select('id').eq('profile_id', userId).single(),
            profile.clinic_id
                ? admin.from('organizations').select('id').eq('id', profile.clinic_id).eq('owner_profile_id', userId).single()
                : Promise.resolve({ data: null }),
            profile.clinic_id
                ? admin.from('organizations').select('name').eq('id', profile.clinic_id).single()
                : Promise.resolve({ data: null })
        ])
        doctor_id = doctorResult.data?.id ?? null
        is_clinic_owner = !!ownershipResult.data
        clinic_name = clinicResult.data?.name ?? null
    } else if (profile.role === 'assistant') {
        const [assistantResult, clinicResult] = await Promise.all([
            admin.from('assistants').select('id, assigned_doctor_id').eq('profile_id', userId).single(),
            profile.clinic_id
                ? admin.from('organizations').select('name').eq('id', profile.clinic_id).single()
                : Promise.resolve({ data: null })
        ])
        assistant_id = assistantResult.data?.id ?? null
        assigned_doctor_id = assistantResult.data?.assigned_doctor_id ?? null
        clinic_name = clinicResult.data?.name ?? null
    }

    return { ...profile, doctor_id, assistant_id, assigned_doctor_id, is_clinic_owner, clinic_name }
})

export async function requireRole(allowedRoles: ('superadmin' | 'doctor' | 'assistant')[]) {
    const profile = await getUserProfile()

    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/login?error=unauthorized')
    }

    return profile
}

// Get clinic_id for current user. Redirects if not assigned.
export async function requireClinicId(): Promise<string> {
    const profile = await getUserProfile()
    if (!profile) redirect('/login')
    if (profile.role === 'superadmin') {
        throw new Error('Superadmin does not belong to a clinic. Use explicit org_id.')
    }
    if (!profile.clinic_id) {
        redirect('/login?error=no_clinic')
    }
    return profile.clinic_id
}

// Require any doctor with a clinic assignment. Redirects if not.
export async function requireDoctorWithClinic(): Promise<UserProfile & { clinic_id: string; doctor_id: string }> {
    const profile = await getUserProfile()
    if (!profile || profile.role !== 'doctor' || !profile.clinic_id || !profile.doctor_id) {
        redirect('/login?error=unauthorized')
    }
    return profile as UserProfile & { clinic_id: string; doctor_id: string }
}

// Require clinic owner (doctor who owns the organization). Redirects if not.
export async function requireClinicOwner(): Promise<UserProfile & { clinic_id: string }> {
    const profile = await getUserProfile()
    if (!profile || !profile.is_clinic_owner || !profile.clinic_id) {
        redirect('/login?error=unauthorized')
    }
    return profile as UserProfile & { clinic_id: string }
}
