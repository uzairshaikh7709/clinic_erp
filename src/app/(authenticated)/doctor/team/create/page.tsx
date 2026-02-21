import { requireClinicOwner } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import CreateStaffForm from './CreateStaffForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CreateStaffPage() {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    // Fetch doctors in this clinic for assistant assignment dropdown
    const { data: doctors } = await admin
        .from('doctors')
        .select('id, specialization, profiles (full_name)')
        .eq('clinic_id', owner.clinic_id)

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/doctor/team" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Add Staff Member</h1>
                    <p className="text-slate-500 text-sm">Create a new doctor or assistant for your clinic</p>
                </div>
            </div>
            <CreateStaffForm doctors={doctors || []} />
        </div>
    )
}
