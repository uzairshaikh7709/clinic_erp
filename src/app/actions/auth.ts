'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function signOut() {
    const supabase = await createClient()

    // Determine redirect URL before clearing session
    let redirectUrl = '/login'
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
        const meta = session.user.user_metadata
        if (meta?.clinic_id && (meta?.role === 'doctor' || meta?.role === 'assistant')) {
            const admin = createAdminClient()
            const { data: org } = await admin
                .from('organizations')
                .select('slug')
                .eq('id', meta.clinic_id)
                .single()
            if (org?.slug) {
                redirectUrl = `/clinic/${org.slug}/login`
            }
        }
    }

    await supabase.auth.signOut()
    redirect(redirectUrl)
}
