import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import ClinicLoginForm from '@/app/clinic/[slug]/login/ClinicLoginForm'

export const dynamic = 'force-dynamic'

async function getPharmacyBySlug(slug: string) {
    const admin = createAdminClient()
    const { data } = await admin
        .from('organizations')
        .select('id, name, slug, logo_url, org_type')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
    return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const org = await getPharmacyBySlug(slug)
    return { title: org ? `${org.name} - Staff Login` : 'Login' }
}

export default async function PharmacyLoginPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const org = await getPharmacyBySlug(slug)

    if (!org || org.org_type !== 'pharmacy') notFound()

    return <ClinicLoginForm clinicName={org.name} clinicSlug={org.slug} logoUrl={org.logo_url} orgType="pharmacy" />
}
