import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import CreateStaffForm from './CreateStaffForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CreateStaffPage() {
    const doctor = await requireDoctorWithClinic()
    const isOwner = doctor.is_clinic_owner
    const admin = createAdminClient()

    // Fetch doctors in this clinic for assistant assignment dropdown (owner only)
    let doctors: any[] = []
    if (isOwner) {
        const { data } = await admin
            .from('doctors')
            .select('id, specialization, profiles (full_name)')
            .eq('clinic_id', doctor.clinic_id)
        doctors = data || []
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/doctor/team" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                        {isOwner ? 'Add Staff Member' : 'Add Assistant'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isOwner ? 'Create a new doctor or assistant for your clinic' : 'Create a new assistant assigned to you'}
                    </p>
                </div>
            </div>
            <CreateStaffForm doctors={doctors} isOwner={isOwner} doctorId={doctor.doctor_id} />
        </div>
    )
}
