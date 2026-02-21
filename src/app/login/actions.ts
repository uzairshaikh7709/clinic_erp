'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function forgotPassword(formData: FormData) {
    const email = (formData.get('email') as string)?.trim()?.toLowerCase()
    if (!email) return { error: 'Email is required' }

    // Check if user exists
    const admin = createAdminClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    if (!profile) return { error: 'No account found with this email address' }

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    })

    if (error) {
        console.error('Password reset error:', error.message)
        return { error: 'Failed to send reset email. Please try again.' }
    }

    return { success: true }
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    // 1. Authenticate (Sets cookies)
    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error('Login Error:', error.message)
        return { error: error.message }
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Authentication failed.' }
    }

    // 2. Fetch Profile using Admin Client (Bypass RLS)
    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('role, is_active, clinic_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profile Fetch Error:', profileError?.message)
        await supabase.auth.signOut()
        return { error: 'Profile not found. Please contact support.' }
    }

    if (!profile.is_active) {
        await supabase.auth.signOut()
        return { error: 'Account is disabled. Contact admin.' }
    }

    const role = profile.role
    const isClinicLogin = formData.get('clinic_login') === 'true'

    // Block org staff from logging in via main /login — they must use their org URL
    if (!isClinicLogin && profile.clinic_id && (role === 'doctor' || role === 'assistant')) {
        const { data: org } = await adminClient
            .from('organizations')
            .select('slug, name')
            .eq('id', profile.clinic_id)
            .single()

        await supabase.auth.signOut()

        if (org?.slug) {
            return { error: `Please login through your clinic portal: /clinic/${org.slug}/login` }
        }
        return { error: 'Please login through your clinic\'s login page.' }
    }

    // 3. Sync Role + Clinic + Slug to Metadata if missing (Fixes existing users)
    let clinicSlug = user.user_metadata?.clinic_slug || null
    const needsSync = user.user_metadata?.role !== role
        || user.user_metadata?.clinic_id !== profile.clinic_id
        || (!clinicSlug && profile.clinic_id)

    if (needsSync) {
        // Fetch org slug if we have a clinic_id but no slug cached yet
        if (profile.clinic_id && !clinicSlug) {
            const { data: org } = await adminClient
                .from('organizations')
                .select('slug')
                .eq('id', profile.clinic_id)
                .single()
            clinicSlug = org?.slug || null
        }
        await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, role, clinic_id: profile.clinic_id, clinic_slug: clinicSlug }
        })
        // Refresh session so the JWT cookie gets the updated metadata
        await supabase.auth.refreshSession()
    }

    if (role === 'superadmin') redirect('/superadmin/dashboard')
    if (role === 'doctor') redirect('/doctor/dashboard')
    if (role === 'assistant') redirect('/assistant/dashboard')

    redirect('/dashboard') // Fallback
}
