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

    return <CreateUserForm doctors={doctors || []} />
}
