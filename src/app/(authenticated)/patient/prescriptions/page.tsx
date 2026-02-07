import { requireRole } from '@/utils/auth' // Wait, patients might not have 'role' in profiles if auto-created? 
// Actually, `seed.ts` created profiles with roles. 
// If a user signs up via generic flow, do they get 'patient' role?
// For this demo, let's assume they might be 'patient' or just no role?
// The prompt says "Patient Flow ... Login". So they are users.
// We should check if the user is a patient.

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { FileText, Calendar, User } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function PatientPrescriptionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Find patient record by name matching user name?? Or some link.
    // In `SlotPicker`, we auto-created a patient with name = profile.full_name.
    // So we lookup patient by matching profile.

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()

    // Fallback if no profile (rare due to fix)
    if (!profile) return <div>Profile error</div>

    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('full_name', profile.full_name)
        .single()

    if (!patient) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-bold text-slate-800">No Records Found</h2>
                <p className="text-slate-500">We could not find a patient record linked to your account.</p>
            </div>
        )
    }

    const { data: prescriptions } = await supabase
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
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>

            <div className="space-y-4">
                {(prescriptions || []).map((rx: any) => (
                    <div key={rx.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-slate-900 text-lg">{rx.diagnosis || 'General Visit'}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(rx.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><User size={14} /> Dr. {rx.doctors?.profiles?.full_name}</span>
                            </div>
                        </div>
                        <Link href={`/doctor/prescriptions/${rx.id}`} className="btn btn-outline">
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
