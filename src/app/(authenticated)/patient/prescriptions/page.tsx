import { getUserProfile } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { FileText, Calendar, User } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function PatientPrescriptionsPage() {
    const profile = await getUserProfile()
    if (!profile) redirect('/login')

    const admin = createAdminClient()
    const clinicId = profile.clinic_id

    // Look up patient by profile_id (direct FK link), fallback to full_name for legacy records
    let { data: patient } = await admin
        .from('patients')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('clinic_id', clinicId)
        .single()

    if (!patient) {
        const { data: legacyPatient } = await admin
            .from('patients')
            .select('id')
            .eq('full_name', profile.full_name)
            .eq('clinic_id', clinicId)
            .limit(1)
            .single()
        patient = legacyPatient
    }

    if (!patient) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-bold text-slate-800">No Records Found</h2>
                <p className="text-slate-500">We could not find a patient record linked to your account.</p>
            </div>
        )
    }

    const { data: prescriptions } = await admin
        .from('prescriptions')
        .select(`
            id,
            created_at,
            diagnosis,
            doctors (
                profiles (full_name),
                specialization
            )
        `)
        .eq('patient_id', patient.id)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-enter">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">My Prescriptions</h1>

            <div className="space-y-4">
                {(prescriptions || []).map((rx: any) => (
                    <div key={rx.id} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-base sm:text-lg truncate">{rx.diagnosis || 'General Visit'}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(rx.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 truncate"><User size={14} /> Dr. {rx.doctors?.profiles?.full_name}</span>
                            </div>
                        </div>
                        <Link href={`/patient/prescriptions/${rx.id}`} className="btn btn-outline w-full sm:w-auto justify-center">
                            <FileText size={18} className="mr-2" /> View & Print
                        </Link>
                    </div>
                ))}

                {(!prescriptions || prescriptions.length === 0) && (
                    <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No prescriptions available.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
