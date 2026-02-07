import { createAdminClient } from '@/utils/supabase/admin'
import BookingWizard from './BookingWizard'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

export const dynamic = 'force-dynamic'

export default async function PublicBookingPage() {
    const admin = createAdminClient()

    // 1. Fetch Doctors
    const { data: doctors } = await admin
        .from('doctors')
        .select(`
            id,
            specialization,
            registration_number,
            profiles (full_name)
        `)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicHeader />
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-12">
                <BookingWizard doctors={doctors || []} />
            </div>
            <PublicFooter />
        </div>
    )
}
