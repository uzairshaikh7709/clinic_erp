import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import PrescriptionView from './PrescriptionView'

export default async function ViewPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const supabase = createAdminClient()

    const [{ data: rx }, { data: org }] = await Promise.all([
        supabase
            .from('prescriptions')
            .select(`
                *,
                doctors (
                    specialization, registration_number,
                    profiles (full_name)
                ),
                patients (
                    full_name, dob, gender, address, registration_number
                )
            `)
            .eq('id', id)
            .eq('clinic_id', clinicId)
            .single(),
        supabase
            .from('organizations')
            .select('name, address, phone, email')
            .eq('id', clinicId)
            .single()
    ])

    if (!rx) return <div>Prescription not found.</div>

    return <PrescriptionView rx={rx} org={org} />
}
