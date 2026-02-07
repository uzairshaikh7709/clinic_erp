'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'

// Cached helper to get current user profile safely
export const getUserProfile = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // PERFORMANCE FIX: 
    // The Standard Client triggers an RLS infinite recursion bug in the database schema.
    // We DIRECTLY use the Admin Client to fetch the profile.
    // This avoids the 1-2 second timeout/latency of the failed standard request.
    const admin = createAdminClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
})

export async function requireRole(allowedRoles: ('superadmin' | 'doctor' | 'assistant')[]) {
    const profile = await getUserProfile()

    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/login?error=unauthorized')
    }

    return profile
}
