import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import CreateOrgForm from './CreateOrgForm'

export default async function CreateOrganizationPage() {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const { data: doctors } = await admin
        .from('doctors')
        .select('*, profiles(full_name)')

    return <CreateOrgForm doctors={doctors || []} />
}
