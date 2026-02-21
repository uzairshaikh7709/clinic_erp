import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import ClinicLoginForm from './ClinicLoginForm'

export const dynamic = 'force-dynamic'

async function getOrgBySlug(slug: string) {
    const admin = createAdminClient()
    const { data } = await admin
        .from('organizations')
        .select('id, name, slug, logo_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
    return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const org = await getOrgBySlug(slug)
    return { title: org ? `${org.name} - Staff Login` : 'Login' }
}

export default async function ClinicLoginPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const org = await getOrgBySlug(slug)

    if (!org) notFound()

    return <ClinicLoginForm clinicName={org.name} clinicSlug={org.slug} logoUrl={org.logo_url} />
}
