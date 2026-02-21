import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import UsersClient from './UsersClient'

export default async function UsersPage() {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const { data: profiles, error } = await admin
        .from('profiles')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })
        .limit(100)

    // If the join fails (no FK relationship), fallback to fetching without the join
    let finalProfiles = profiles
    if (error) {
        const { data: fallbackProfiles } = await admin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        // Manually attach org names
        const { data: orgs } = await admin
            .from('organizations')
            .select('id, name')

        const orgMap = new Map((orgs || []).map(o => [o.id, o.name]))
        finalProfiles = (fallbackProfiles || []).map(p => ({
            ...p,
            organizations: p.clinic_id ? { name: orgMap.get(p.clinic_id) || null } : null
        }))
    }

    return <UsersClient initialProfiles={finalProfiles || []} />
}
