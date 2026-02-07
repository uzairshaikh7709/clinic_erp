import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Plus, Clock, MoreHorizontal, User, Calendar, FileText, ChevronRight } from 'lucide-react'

export default async function DoctorDashboard() {
    const profile = await requireRole(['doctor'])
    const supabase = createAdminClient()

    // 1. Get Doctor ID
    const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

    // If no doctor record, prompt to complete profile? Or assume seeded.
    // For now, resiliently handle.
    const doctorId = doctor?.id

    // 2. Fetch Appointments (Today & Upcoming)
    const today = new Date().toISOString().split('T')[0]

    let appointments: any[] = []
    let stats = { today: 0, pending: 0, newPatients: 0 }

    if (doctorId) {
        const { data: appts } = await supabase
            .from('appointments')
            .select(`
                id,
                start_time,
                status,
                patients (full_name, id)
            `)
            .eq('doctor_id', doctorId)
            // .gte('start_time', today) // Showing all for now to avoid confusion
            .order('start_time', { ascending: true }) // Show upcoming first
            .limit(50)

        if (appts) {
            appointments = appts.map(a => ({
                id: a.id,
                patient: Array.isArray(a.patients) ? a.patients[0]?.full_name : (a.patients as any)?.full_name || 'Unknown',
                time: new Date(a.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
                type: 'Consultation', // Default for now, or fetch if we have 'type'
                status: a.status,
                img: (Array.isArray(a.patients) ? a.patients[0]?.full_name : (a.patients as any)?.full_name || 'U').split(' ').map((n: any) => n[0]).join('').slice(0, 2)
            }))

            // Calc Stats (Mocking logic slightly for "New" vs "Pending" based on status for now)
            stats.today = appts.filter(a => a.start_time.startsWith(today)).length
            stats.pending = appts.filter(a => a.status === 'booked').length
            stats.newPatients = 0 // Needs 'created_at' of patient relative to today, skipping for speed
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500">Welcome back, Dr. {profile.full_name?.split(' ')[0]}</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/doctor/schedule" className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                        <Clock size={18} className="mr-2 text-slate-400" /> Manage Schedule
                    </Link>
                    <Link href="/doctor/appointments" className="btn btn-primary shadow-lg shadow-blue-500/20">
                        <Plus size={18} className="mr-2" /> All Appts
                    </Link>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoCard
                    label="Appointments Today"
                    value={stats.today.toString()}
                    icon={Calendar}
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <InfoCard
                    label="Pending Check-ins"
                    value={stats.pending.toString()}
                    icon={User}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <InfoCard
                    label="Total Appointments"
                    value={appointments.length.toString()}
                    icon={FileText}
                    color="text-amber-500"
                    bg="bg-amber-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Todays Schedule</h3>
                            <Link href="/doctor/appointments" className="text-sm font-medium text-[#0077B6] hover:underline">See All</Link>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {appointments.filter(a => new Date(a.time).getDate() === new Date().getDate()).map((apt) => (
                                <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                                            {apt.img}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{apt.patient}</p>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Clock size={14} /> {apt.time}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{apt.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={apt.status} />
                                        <div className="flex gap-1">
                                            {/* Action: Write Rx */}
                                            <Link href={`/doctor/prescriptions/new/${apt.id}`} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#0077B6] transition-colors" title="Write Rx">
                                                <FileText size={18} />
                                            </Link>
                                            <button className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {appointments.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                                    <p>No appointments found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Side Column */}
                <div className="space-y-6">
                    <div className="bg-[#F0F9FF] rounded-xl p-6 border border-blue-100">
                        <h3 className="font-bold text-slate-800 mb-2">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link href="/doctor/patients/new" className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 text-slate-700 font-medium hover:shadow-md transition-all text-sm group">
                                <span className="flex items-center gap-2"><User size={16} className="text-[#0077B6]" /> Register Patient</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#0077B6]" />
                            </Link>
                            <Link href="/doctor/prescriptions" className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 text-slate-700 font-medium hover:shadow-md transition-all text-sm group">
                                <span className="flex items-center gap-2"><FileText size={16} className="text-[#0077B6]" /> View Prescriptions</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#0077B6]" />
                            </Link>
                            <Link href="/doctor/schedule" className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 text-slate-700 font-medium hover:shadow-md transition-all text-sm group">
                                <span className="flex items-center gap-2"><Clock size={16} className="text-[#0077B6]" /> Configure Schedule</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#0077B6]" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${bg} ${color} flex items-center justify-center`}>
                <Icon size={24} />
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    let styles = "bg-slate-100 text-slate-600"
    if (status === 'Checked In') styles = "bg-emerald-100 text-emerald-700"
    if (status === 'Late') styles = "bg-red-100 text-red-700"
    if (status === 'Upcoming') styles = "bg-blue-50 text-blue-700"

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles}`}>
            {status}
        </span>
    )
}
