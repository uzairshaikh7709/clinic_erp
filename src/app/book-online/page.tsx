import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'
import { Building2, MapPin, Phone, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const getCachedClinics = unstable_cache(
    async () => {
        const admin = createAdminClient()
        const { data } = await admin
            .from('organizations')
            .select('id, name, slug, address, phone')
            .eq('is_active', true)
            .order('name', { ascending: true })
        return data || []
    },
    ['clinics-list'],
    { revalidate: 3600, tags: ['organizations'] }
)

export default async function PublicBookingPage() {
    const clinics = await getCachedClinics()

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicHeader />
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-12">
                <div className="text-center mb-8 md:mb-10 animate-enter">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 md:mb-3">Find Your Clinic</h1>
                    <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">Select your clinic below to book an appointment.</p>
                </div>

                {clinics.length === 0 ? (
                    <div className="text-center py-16 animate-enter">
                        <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No clinics available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4 animate-enter">
                        {clinics.map((clinic) => (
                            <Link
                                key={clinic.id}
                                href={`/book-online/${clinic.slug}`}
                                className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0077B6] hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0077B6] flex items-center justify-center flex-shrink-0">
                                    <Building2 size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 group-hover:text-[#0077B6] transition-colors">{clinic.name}</h3>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        {clinic.address && (
                                            <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                                                <MapPin size={13} className="flex-shrink-0" /> {clinic.address}
                                            </p>
                                        )}
                                        {clinic.phone && (
                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                <Phone size={13} className="flex-shrink-0" /> {clinic.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-[#0077B6] transition-colors flex-shrink-0" size={20} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <PublicFooter />
        </div>
    )
}
