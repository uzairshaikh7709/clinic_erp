import { requireRole } from '@/utils/auth'
import Link from 'next/link'
import { Calendar, User, Phone, Clock } from 'lucide-react'

export default async function AssistantDashboard() {
    const profile = await requireRole(['assistant'])

    const todaysAppointments = [] as any[] // Placeholder

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Front Desk Portal</h1>
                    <p className="text-slate-500 text-sm">Logged in as {profile.full_name}</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/assistant/patients/new" className="btn btn-secondary">
                        <User size={16} className="mr-2" /> Register Patient
                    </Link>
                    <Link href="/book" className="btn btn-primary">
                        <Phone size={16} className="mr-2" /> Book Appt
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card border-l-4 border-l-sky-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Check-ins Pending</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
                        </div>
                        <User className="text-sky-500 opacity-20" size={40} />
                    </div>
                </div>
                <div className="card border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Scheduled Today</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
                        </div>
                        <Calendar className="text-emerald-500 opacity-20" size={40} />
                    </div>
                </div>
                <div className="card border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Next Available Slot</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">10:45 AM</p>
                        </div>
                        <Clock className="text-amber-500 opacity-20" size={40} />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Appointment Queue</h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search patient..." className="input w-64 text-sm" />
                    </div>
                </div>

                <div className="min-h-[200px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                    <Calendar size={32} className="mb-2 opacity-50" />
                    <p>No appointments to display right now.</p>
                </div>
            </div>
        </div>
    )
}
