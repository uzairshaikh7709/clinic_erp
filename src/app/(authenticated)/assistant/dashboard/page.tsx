import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Calendar, User, Phone, Clock, Users, ChevronRight } from 'lucide-react'

export default async function AssistantDashboard() {
    const profile = await requireRole(['assistant'])
    const clinicId = profile.clinic_id
    const admin = createAdminClient()

    const doctorId = profile.assigned_doctor_id
    const today = new Date().toISOString().split('T')[0]

    let todaysAppointments: any[] = []
    let pendingCount = 0
    let todayCount = 0
    let totalPatients = 0

    if (doctorId) {
        const [{ data: appts }, { count: patientCount }] = await Promise.all([
            admin
                .from('appointments')
                .select(`
                    id,
                    start_time,
                    status,
                    patients (full_name, phone)
                `)
                .eq('doctor_id', doctorId)
                .eq('clinic_id', clinicId)
                .gte('start_time', `${today}T00:00:00`)
                .lte('start_time', `${today}T23:59:59`)
                .order('start_time', { ascending: true }),
            admin
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicId),
        ])

        todaysAppointments = appts || []
        todayCount = todaysAppointments.length
        pendingCount = todaysAppointments.filter(a => a.status === 'booked').length
        totalPatients = patientCount ?? 0
    }

    const completedCount = todaysAppointments.filter(a => a.status === 'completed').length

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Front Desk Portal</h1>
                    <p className="text-slate-500 text-sm">Logged in as {profile.full_name}</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <Link href="/assistant/patients/new" className="btn btn-secondary text-sm">
                        <User size={16} className="mr-1.5" /> Register
                    </Link>
                    <Link href="/assistant/appointments" className="btn btn-primary text-sm">
                        <Calendar size={16} className="mr-1.5" /> Schedule
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Pending Check-ins" value={pendingCount} icon={User} color="text-sky-500" bg="bg-sky-50" />
                <StatCard label="Scheduled Today" value={todayCount} icon={Calendar} color="text-emerald-500" bg="bg-emerald-50" />
                <StatCard label="Completed Today" value={completedCount} icon={Clock} color="text-amber-500" bg="bg-amber-50" />
                <StatCard label="Total Patients" value={totalPatients} icon={Users} color="text-violet-500" bg="bg-violet-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Today's Queue */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">Today&apos;s Queue</h3>
                        </div>
                        <Link href="/assistant/appointments" className="text-sm font-medium text-indigo-600 hover:underline">
                            See All
                        </Link>
                    </div>

                    {todaysAppointments.length === 0 ? (
                        <div className="p-10 sm:p-12 text-center text-slate-400">
                            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                            <p>No appointments scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {todaysAppointments.map((apt: any) => (
                                <div key={apt.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs flex-shrink-0">
                                            {apt.patients?.full_name?.[0] || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{apt.patients?.full_name}</p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 pl-12 sm:pl-0 flex-shrink-0">
                                        <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold capitalize
                                            ${apt.status === 'booked' ? 'bg-blue-50 text-blue-700' :
                                                apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {apt.status}
                                        </span>
                                        {apt.patients?.phone && (
                                            <a
                                                href={`https://wa.me/${apt.patients.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                title="WhatsApp"
                                            >
                                                <Phone size={13} />
                                                <span className="hidden sm:inline">{apt.patients.phone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2">
                        <ChevronRight size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-800">Quick Actions</h3>
                    </div>
                    <div className="p-3 sm:p-4 space-y-2">
                        <Link href="/assistant/patients/new" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><User size={16} className="text-indigo-500" /> Register Patient</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link href="/assistant/appointments" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> View Schedule</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                        </Link>
                        <Link href="/assistant/patients" className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-200 transition-all text-sm group">
                            <span className="flex items-center gap-2"><Users size={16} className="text-indigo-500" /> Patient Registry</span>
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
