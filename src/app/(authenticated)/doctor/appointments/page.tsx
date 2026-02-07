import { requireRole } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Calendar, Clock, User, MapPin, MoreHorizontal, Plus, Filter } from 'lucide-react'

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams
    const profile = await requireRole(['doctor'])
    const admin = createAdminClient()

    // Get Doctor ID
    const { data: doctor } = await admin
        .from('doctors')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

    if (!doctor) return <div>Doctor profile not found.</div>

    // Build Query
    let query = admin
        .from('appointments')
        .select(`
            id,
            start_time,
            status,
            patients (
                full_name,
                gender,
                dob
            )
        `)
        .eq('doctor_id', doctor.id)
        .order('start_time', { ascending: true })

    // Filter by status if provided (default: all upcoming?) 
    // Let's simplified: Show all logic for now, or simple tabs.
    if (status) {
        query = query.eq('status', status)
    } else {
        // Default: Show non-cancelled? or just everything sorted desc?
        // Let's show everything for lists.
    }

    const { data: appointments } = await query

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
                    <p className="text-slate-500 text-sm">Manage your schedule and patient visits</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                        <Link href="/doctor/appointments" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!status ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                            All
                        </Link>
                        <Link href="/doctor/appointments?status=booked" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${status === 'booked' ? 'bg-blue-50 text-[#0077B6]' : 'text-slate-500 hover:text-slate-800'}`}>
                            Upcoming
                        </Link>
                        <Link href="/doctor/appointments?status=completed" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
                            Completed
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
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
                                appointments.map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">
                                                    {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(apt.start_time).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0077B6] flex items-center justify-center font-bold text-xs">
                                                    {apt.patients?.full_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{apt.patients?.full_name}</p>
                                                    <p className="text-xs text-slate-500">{apt.patients?.gender}, {new Date().getFullYear() - new Date(apt.patients?.dob || '2000').getFullYear()}y</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            Consultation
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize 
                                                ${apt.status === 'booked' ? 'bg-blue-50 text-blue-700' :
                                                    apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {apt.status !== 'completed' && (
                                                    <Link href={`/doctor/prescriptions/new/${apt.id}`} className="btn btn-xs btn-primary">
                                                        Start Visit
                                                    </Link>
                                                )}
                                                <button className="p-2 text-slate-400 hover:text-slate-600">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div >
                                        </td >
                                    </tr >
                                ))
                            )}
                        </tbody >
                    </table >
                </div >
            </div >
        </div >
    )
}
