import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import TeamClient from './TeamClient'

export default async function TeamPage() {
    const doctor = await requireDoctorWithClinic()
    const isOwner = doctor.is_clinic_owner
    const admin = createAdminClient()

    let members: any[] = []
    let orgSlug = ''
    let orgName = ''

    if (isOwner) {
        // Clinic owner: see all members
        const [{ data: allMembers }, { data: org }] = await Promise.all([
            admin
                .from('profiles')
                .select('id, email, full_name, role, is_active, created_at')
                .eq('clinic_id', doctor.clinic_id)
                .order('created_at', { ascending: false })
                .limit(100),
            admin
                .from('organizations')
                .select('slug, name')
                .eq('id', doctor.clinic_id)
                .single()
        ])
        members = allMembers || []
        orgSlug = org?.slug || ''
        orgName = org?.name || ''
    } else {
        // Regular doctor: see only their assigned assistants
        const { data: myAssistants } = await admin
            .from('assistants')
            .select('profile_id')
            .eq('assigned_doctor_id', doctor.doctor_id)
            .eq('clinic_id', doctor.clinic_id)

        const profileIds = (myAssistants || []).map(a => a.profile_id)

        if (profileIds.length > 0) {
            const { data: assistantProfiles } = await admin
                .from('profiles')
                .select('id, email, full_name, role, is_active, created_at')
                .in('id', profileIds)
                .order('created_at', { ascending: false })

            members = assistantProfiles || []
        }
    }

    return (
        <TeamClient
            members={members}
            ownerId={doctor.id}
            orgSlug={orgSlug}
            orgName={orgName}
            isOwner={isOwner}
        />
    )
}
