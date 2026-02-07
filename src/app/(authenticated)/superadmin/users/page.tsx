import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import UsersClient from './UsersClient'

export default async function UsersPage() {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const { data: profiles } = await admin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    return <UsersClient initialProfiles={profiles || []} />
}
