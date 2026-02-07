import { requireRole } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Search, User, Plus } from 'lucide-react'

export default async function AssistantPatientsPage() {
    const profile = await requireRole(['assistant'])
    const supabase = await createClient()

    const { data: assistant } = await supabase
        .from('assistants')
        .select('doctor_id')
        .eq('profile_id', profile.id)
        .single()

    if (!assistant?.doctor_id) return <div>No doctor assigned.</div>

    // Identical logic to Doctor view, but read only
    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            patients (
                id, full_name, dob, gender, registration_number
            )
        `)
        .eq('doctor_id', assistant.doctor_id)
        .order('created_at', { ascending: false })

    const patientsMap = new Map()
    if (appointments) {
        appointments.forEach((a: any) => {
            if (a.patients && !patientsMap.has(a.patients.id)) {
                patientsMap.set(a.patients.id, a.patients)
            }
        })
    }
    const patients = Array.from(patientsMap.values())

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Patient Registry</h1>
                <Link href="/assistant/patients/new" className="btn btn-primary shadow-lg shadow-blue-500/20">
                    <Plus size={18} className="mr-2" /> Add Patient
                </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {patients.map((p) => (
                        <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                {p.full_name?.[0]}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{p.full_name}</p>
                                <p className="text-xs text-slate-500">
                                    {p.registration_number} • {p.gender}
                                </p>
                            </div>
                        </div>
                    ))}
                    {patients.length === 0 && <div className="p-8 text-center text-slate-400">No patients found.</div>}
                </div>
            </div>
        </div>
    )
}
