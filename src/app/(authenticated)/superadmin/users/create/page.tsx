import { requireRole } from '@/utils/auth'
import CreateUserForm from './CreateUserForm'
import { createAdminClient } from '@/utils/supabase/admin'

export default async function CreateUserPage() {
    await requireRole(['superadmin'])
    const supabase = createAdminClient()

    // Fetch doctors for assignment dropdown
    const { data: doctors } = await supabase
        .from('doctors')
        .select('*, profiles(full_name)')

    // Fetch organizations for org assignment
    const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

    return <CreateUserForm doctors={doctors || []} organizations={organizations || []} />
}
