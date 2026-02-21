import { requireClinicOwner } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import TeamClient from './TeamClient'

export default async function TeamPage() {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    const [{ data: members }, { data: org }] = await Promise.all([
        admin
            .from('profiles')
            .select('id, email, full_name, role, is_active, created_at')
            .eq('clinic_id', owner.clinic_id)
            .order('created_at', { ascending: false })
            .limit(100),
        admin
            .from('organizations')
            .select('slug, name')
            .eq('id', owner.clinic_id)
            .single()
    ])

    return (
        <TeamClient
            members={members || []}
            ownerId={owner.id}
            orgSlug={org?.slug || ''}
            orgName={org?.name || ''}
        />
    )
}
