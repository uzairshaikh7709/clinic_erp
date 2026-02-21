import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Plus, Clock, User, Calendar, FileText, ChevronRight, Phone } from 'lucide-react'

export default async function DoctorDashboard() {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const supabase = createAdminClient()

    const today = new Date().toISOString().split('T')[0]

    const [{ data: appts }, { count: totalPatients }, { count: totalRx }] = await Promise.all([
        supabase
            .from('appointments')
            .select(`
                id,
                start_time,
                status,
                patients (full_name, id, phone),
                doctors!inner(id, profile_id)
            `)
            .eq('doctors.profile_id', profile.id)
            .eq('clinic_id', clinicId)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`)
            .order('start_time', { ascending: true }),
        supabase
            .from('appointments')
            .select('patient_id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId),
        supabase
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', profile.doctor_id!)
            .eq('clinic_id', clinicId),
    ])

    const appointments = (appts || []).map(a => ({
        id: a.id,
        patient: Array.isArray(a.patients) ? a.patients[0]?.full_name : (a.patients as any)?.full_name || 'Unknown',
        phone: Array.isArray(a.patients) ? a.patients[0]?.phone : (a.patients as any)?.phone || null,
        startTime: a.start_time,
        time: new Date(a.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
        type: 'Consultation',
        status: a.status,
        img: (Array.isArray(a.patients) ? a.patients[0]?.full_name : (a.patients as any)?.full_name || 'U').split(' ').map((n: any) => n[0]).join('').slice(0, 2)
    }))

    const todayCount = appointments.length
    const pendingCount = appointments.filter(a => a.status === 'booked').length

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 text-sm">Welcome back, Dr. {profile.full_name?.split(' ')[0]}</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <Link href="/doctor/schedule" className="btn btn-secondary text-sm">
                        <Clock size={16} className="mr-1.5 text-slate-400" /> Schedule
                    </Link>
                    <Link href="/doctor/appointments" className="btn btn-primary text-sm">
                        <Plus size={16} className="mr-1.5" /> All Appts
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Today's Appts" value={todayCount} icon={Calendar} color="text-blue-500" bg="bg-blue-50" />
                <StatCard label="Pending Check-ins" value={pendingCount} icon={User} color="text-emerald-500" bg="bg-emerald-50" />
                <StatCard label="Total Patients" value={totalPatients ?? 0} icon={User} color="text-violet-500" bg="bg-violet-50" />
                <StatCard label="Prescriptions" value={totalRx ?? 0} icon={FileText} color="text-amber-500" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">Today&apos;s Schedule</h3>
                        </div>
                        <Link href="/doctor/appointments" className="text-sm font-medium text-indigo-600 hover:underline">See All</Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs sm:text-sm flex-shrink-0">
                                        {apt.img}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{apt.patient}</p>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-0.5">
                                            <span className="flex items-center gap-1"><Clock size={13} /> {apt.time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 pl-13 sm:pl-0 flex-shrink-0">
                                    <StatusBadge status={apt.status} />
                                    <div className="flex gap-1">
                                        {apt.status === 'booked' && (
                                            <Link href={`/doctor/prescriptions/new/${apt.id}`} className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Start Visit">
                                                <FileText size={16} />
                                            </Link>
                                        )}
                                        {apt.phone && (
                                            <a
                                                href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-medium"
                                                title="WhatsApp"
                                            >
                                                <Phone size={13} />
                                                <span className="hidden sm:inline">{apt.phone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {appointments.length === 0 && (
                            <div className="p-10 sm:p-12 text-center text-slate-400">
                                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                                <p>No appointments scheduled for today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                        <ChevronRight size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-800">Quick Actions</h3>
                    </div>
                    <div className="p-3 sm:p-4 space-y-2">
                        <Link href="/doctor/patients/new" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><User size={16} className="text-indigo-500" /> Register Patient</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link href="/doctor/patients" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><User size={16} className="text-indigo-500" /> My Patients</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link href="/doctor/schedule" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Configure Schedule</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link href="/doctor/templates" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><FileText size={16} className="text-indigo-500" /> Rx Templates</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, color, bg }: {
    label: string; value: number; icon: any; color: string; bg: string
}) {
    return (
        <div className="card p-3 sm:p-5 flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    let styles = 'bg-slate-100 text-slate-600'
    if (status === 'booked') styles = 'bg-blue-50 text-blue-700'
    if (status === 'completed') styles = 'bg-emerald-50 text-emerald-700'
    if (status === 'cancelled') styles = 'bg-red-50 text-red-600'

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${styles}`}>
            {status}
        </span>
    )
}
