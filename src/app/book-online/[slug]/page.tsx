import { createAdminClient } from '@/utils/supabase/admin'
import BookingWizard from '../BookingWizard'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, LogIn } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getOrgBySlug(slug: string) {
    const admin = createAdminClient()
    const { data } = await admin
        .from('organizations')
        .select('id, name, slug, address, phone, email, logo_url, org_type')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
    return data
}

export default async function OrgBookingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const org = await getOrgBySlug(slug)

    if (!org || org.org_type === 'pharmacy') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
                <Building2 size={48} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Clinic Not Found</h1>
                <p className="text-slate-500 mb-6">This clinic booking link is invalid or the clinic is no longer active.</p>
                <Link href="/book-online" className="btn btn-primary inline-flex">
                    Browse All Clinics
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col">
            {/* Clinic Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href={`/clinic/${slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {org.logo_url ? (
                            <Image src={org.logo_url} alt={org.name} width={36} height={36} className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                                <Building2 size={18} className="text-white" />
                            </div>
                        )}
                        <span className="font-bold text-lg tracking-tight text-slate-900">{org.name}</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={`/clinic/${slug}/login`}
                            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 px-3 py-1.5"
                        >
                            <LogIn size={15} /> Staff
                        </Link>
                        <Link
                            href={`/clinic/${slug}`}
                            className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                        >
                            <Calendar size={14} /> <span className="hidden sm:inline">Clinic Home</span><span className="sm:hidden">Home</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Booking Content */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-12">
                <div className="mb-6">
                    <Link href={`/clinic/${slug}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={16} /> Back to {org.name}
                    </Link>
                </div>
                <BookingWizard clinicId={org.id} clinicName={org.name} clinicSlug={org.slug} />
            </div>

            {/* Clinic Footer */}
            <footer className="bg-slate-950 text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {org.logo_url ? (
                                <Image src={org.logo_url} alt={org.name} width={28} height={28} className="w-7 h-7 rounded-lg object-cover opacity-70" />
                            ) : (
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Building2 size={14} className="text-white/50" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-400">{org.name}</span>
                        </div>
                        <p className="text-sm">&copy; {new Date().getFullYear()} {org.name}. All rights reserved.</p>
                        <div className="flex items-center gap-4 text-sm">
                            <Link href={`/clinic/${slug}`} className="hover:text-white transition-colors">Clinic Home</Link>
                            <Link href={`/clinic/${slug}/login`} className="hover:text-white transition-colors">Staff Portal</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
