'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, FileText, Phone, Calendar } from 'lucide-react'

interface Appointment {
    id: string
    patient: string
    phone: string | null
    startTime: string
    time: string
    type: string
    status: string
    img: string
}

export default function DashboardSchedule({ appointments }: { appointments: Appointment[] }) {
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        try {
            const stored = localStorage.getItem('dr_visited_appointments')
            if (stored) setVisitedIds(new Set(JSON.parse(stored)))
        } catch {}
    }, [])

    const markVisited = (id: string) => {
        setVisitedIds(prev => {
            const updated = new Set(prev)
            updated.add(id)
            try {
                localStorage.setItem('dr_visited_appointments', JSON.stringify([...updated]))
            } catch {}
            return updated
        })
    }

    if (appointments.length === 0) {
        return (
            <div className="p-10 sm:p-12 text-center text-slate-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p>No appointments scheduled for today.</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-slate-100">
            {appointments.map((apt) => {
                const isVisited = visitedIds.has(apt.id)
                return (
                    <div key={apt.id} className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 transition-colors group ${isVisited ? 'bg-sky-50 border-l-4 border-[#0077B6]' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${isVisited ? 'bg-[#0077B6]/10 border-[#0077B6]/20 text-[#0077B6]' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
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
                                    <Link
                                        href={`/doctor/prescriptions/new/${apt.id}`}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Start Visit"
                                        onClick={() => markVisited(apt.id)}
                                    >
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
                )
            })}
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
