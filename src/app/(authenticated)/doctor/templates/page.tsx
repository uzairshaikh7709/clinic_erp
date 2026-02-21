import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import TemplatesPage from './display'

export default async function Page() {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id!
    const admin = createAdminClient()

    const { data: templates } = await admin
        .from('prescription_templates')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })

    return <TemplatesPage templates={templates || []} />
}
