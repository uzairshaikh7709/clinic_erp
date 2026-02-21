import { createAdminClient } from '@/utils/supabase/admin'
import BookingWizard from '../BookingWizard'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getOrgBySlug(slug: string) {
    const admin = createAdminClient()
    const { data } = await admin
        .from('organizations')
        .select('id, name, slug, address, phone')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
    return data
}

export default async function OrgBookingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const org = await getOrgBySlug(slug)

    if (!org) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
                    <div className="text-center space-y-4">
                        <Building2 size={48} className="mx-auto text-slate-300" />
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Clinic Not Found</h1>
                        <p className="text-slate-500">This clinic booking link is invalid or the clinic is no longer active.</p>
                        <Link href="/book-online" className="btn btn-primary inline-flex">
                            Browse All Clinics
                        </Link>
                    </div>
                </div>
                <PublicFooter />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicHeader />
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-12">
                <div className="mb-6">
                    <Link href="/book-online" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
                        <ArrowLeft size={16} /> All Clinics
                    </Link>
                </div>
                <BookingWizard clinicId={org.id} clinicName={org.name} />
            </div>
            <PublicFooter />
        </div>
    )
}
