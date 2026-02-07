import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Calendar, User, MoreHorizontal, Plus } from 'lucide-react'

export default async function AssistantAppointmentsPage() {
    const profile = await requireRole(['assistant'])
    const admin = createAdminClient()

    // Assistants need to see their assigned doctor's schedule.
    // Schema check: Assistants table has 'doctor_id'? Or Doctors has 'assistant_id'? 
    // Usually Assistants -> Doctor.

    const { data: assistant } = await admin
        .from('assistants')
        .select('assigned_doctor_id')
        .eq('profile_id', profile.id)
        .single()

    if (!assistant?.assigned_doctor_id) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-bold text-slate-800">No Doctor Assigned</h2>
                <p className="text-slate-500">Please ask an admin to assign you to a doctor.</p>
            </div>
        )
    }

    const { data: appointments } = await admin
        .from('appointments')
        .select(`
            id,
            start_time,
            status,
            patients (full_name, gender, dob)
        `)
        .eq('doctor_id', assistant.assigned_doctor_id)
        .order('start_time', { ascending: true })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Doctor's Schedule</h1>
                    <p className="text-slate-500 text-sm">Manage appointments for your assigned doctor</p>
                </div>
                <div className="flex gap-3">
                    {/* Assistant can book too? reusing Patient book link for now or just view */}
                    <Link href="/book" className="btn btn-primary shadow-lg shadow-blue-500/20">
                        <Plus size={18} className="mr-2" /> Book Slot
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Patient</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(appointments || []).map((apt: any) => (
                            <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">
                                    {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    <div className="text-xs font-normal text-slate-400">{new Date(apt.start_time).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900">{apt.patients?.full_name}</div>
                                    <div className="text-xs text-slate-500">{apt.patients?.gender}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-slate-100 text-slate-600`}>
                                        {apt.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
