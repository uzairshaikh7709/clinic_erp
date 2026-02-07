import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Plus, FileText, Search, Calendar } from 'lucide-react'
import PrescriptionListActions from './PrescriptionListActions'

export default async function PrescriptionsPage() {
    const profile = await requireRole(['doctor'])
    const supabase = createAdminClient()

    // Fetch doctor ID
    const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

    if (!doctor) return <div>Doctor profile not found.</div>

    // Fetch Prescriptions
    const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select(`
            id,
            created_at,
            diagnosis,
            patients (full_name, gender),
            appointments (start_time)
        `)
        .eq('doctor_id', doctor.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
                    <p className="text-slate-500 text-sm">Manage patient prescriptions and records</p>
                </div>
                <div className="flex gap-3">
                    {/* Usually we create prescription from appointment, but maybe a direct button? 
                         Let's keep it clean: Prescriptions are linked to appointments. 
                         So maybe "Go to Schedule" to write one? or a standalone "Write Script"?
                         For now, list view.
                     */}
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by patient name..."
                            className="input pl-10 h-10 bg-white"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {!prescriptions || prescriptions.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <FileText size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No prescriptions written yet.</p>
                            <Link href="/doctor/appointments" className="text-[#0077B6] font-medium hover:underline mt-2 inline-block">
                                Go to Appointments to write one
                            </Link>
                        </div>
                    ) : (
                        prescriptions.map((p: any) => (
                            <div key={p.id} className="relative block hover:bg-slate-50 transition-colors group">
                                <Link href={`/doctor/prescriptions/${p.id}`} className="absolute inset-0 z-0">
                                    <span className="sr-only">View Prescription</span>
                                </Link>
                                <div className="p-4 flex items-center justify-between pointer-events-none">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0077B6] flex items-center justify-center">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{p.patients?.full_name}</p>
                                            <p className="text-sm text-slate-500">Diagnosis: {p.diagnosis || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 justify-end mb-2">
                                            <Calendar size={14} />
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex justify-end pointer-events-auto relative z-10">
                                            <PrescriptionListActions id={p.id} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
