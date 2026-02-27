import { createAdminClient } from '@/utils/supabase/admin'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PharmacyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const admin = createAdminClient()
    const { data: org } = await admin
        .from('organizations')
        .select('id, slug, org_type')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!org || org.org_type !== 'pharmacy') notFound()

    redirect(`/pharmacy/${slug}/login`)
}
