import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Calendar, User, Plus, Phone, Clock } from 'lucide-react'

export default async function AssistantAppointmentsPage() {
    const profile = await requireRole(['assistant'])
    const clinicId = profile.clinic_id
    const admin = createAdminClient()

    if (!profile.assigned_doctor_id) {
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
            appointment_type,
            patients (full_name, gender, dob, phone)
        `)
        .eq('doctor_id', profile.assigned_doctor_id)
        .eq('clinic_id', clinicId)
        .order('start_time', { ascending: false })

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Doctor&apos;s Schedule</h1>
                    <p className="text-slate-500 text-sm">Manage appointments for your assigned doctor</p>
                </div>
                <Link href="/assistant/patients/new" className="btn btn-primary shadow-lg shadow-blue-500/20 text-sm">
                    <Plus size={16} className="mr-1.5" /> Register Patient
                </Link>
            </div>

            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
                {(!appointments || appointments.length === 0) ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                        No appointments found.
                    </div>
                ) : (
                    (appointments || []).map((apt: any) => (
                        <div key={apt.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs flex-shrink-0">
                                        {apt.patients?.full_name?.[0] || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm truncate">{apt.patients?.full_name}</p>
                                        <p className="text-xs text-slate-500">{apt.patients?.gender}{apt.patients?.dob && ` • ${new Date().getFullYear() - new Date(apt.patients.dob).getFullYear()}y`}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize flex-shrink-0
                                    ${apt.status === 'booked' ? 'bg-blue-50 text-blue-700' :
                                        apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                            apt.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {apt.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock size={13} />
                                    {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(apt.start_time).toLocaleDateString()}
                                </span>
                                <AppointmentTypeBadge type={apt.appointment_type} />
                                {apt.patients?.phone && (
                                    <a
                                        href={`https://wa.me/${apt.patients.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    >
                                        <Phone size={13} />
                                        {apt.patients.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-3">Time</th>
                                <th className="px-4 lg:px-6 py-3">Patient</th>
                                <th className="px-4 lg:px-6 py-3">Type</th>
                                <th className="px-4 lg:px-6 py-3">Status</th>
                                <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(!appointments || appointments.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                (appointments || []).map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 lg:px-6 py-3 font-bold text-slate-800">
                                            {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <div className="text-xs font-normal text-slate-400">{new Date(apt.start_time).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3">
                                            <div className="font-semibold text-slate-900">{apt.patients?.full_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {apt.patients?.gender}
                                                {apt.patients?.dob && ` • ${new Date().getFullYear() - new Date(apt.patients.dob).getFullYear()}y`}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3">
                                            <AppointmentTypeBadge type={apt.appointment_type} />
                                        </td>
                                        <td className="px-4 lg:px-6 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                                ${apt.status === 'booked' ? 'bg-blue-50 text-blue-700' :
                                                    apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        apt.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                            'bg-slate-100 text-slate-600'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-right">
                                            {apt.patients?.phone && (
                                                <a
                                                    href={`https://wa.me/${apt.patients.phone.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <Phone size={13} />
                                                    {apt.patients.phone}
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function AppointmentTypeBadge({ type }: { type?: string }) {
    if (type === 'online') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">Online</span>
    if (type === 'walk_in') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Walk-in</span>
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">In-clinic</span>
}
