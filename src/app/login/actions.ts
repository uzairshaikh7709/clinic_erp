'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'


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
        .select('role, is_active')
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

    // 3. Sync Role to Metadata if missing (Fixes existing users)
    if (user.user_metadata?.role !== role) {
        await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, role }
        })
    }

    // Revalidate and Redirect
    revalidatePath('/', 'layout')

    if (role === 'superadmin') redirect('/superadmin/dashboard')
    if (role === 'doctor') redirect('/doctor/dashboard')
    if (role === 'assistant') redirect('/assistant/dashboard')

    redirect('/dashboard') // Fallback
}
