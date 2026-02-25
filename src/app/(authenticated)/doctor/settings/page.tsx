import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { Settings } from 'lucide-react'
import SignatureEditor from './SignatureEditor'

export default async function DoctorSettingsPage() {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const { data: doctorRecord } = await admin
        .from('doctors')
        .select('signature_url')
        .eq('id', doctor.doctor_id)
        .single()

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <div className="flex items-center gap-2">
                    <Settings size={20} className="text-slate-400" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Settings</h1>
                </div>
                <p className="text-slate-500 text-sm mt-1">Manage your personal preferences</p>
            </div>

            <SignatureEditor currentUrl={doctorRecord?.signature_url || ''} />
        </div>
    )
}
