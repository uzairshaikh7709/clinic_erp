'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Search, Calendar } from 'lucide-react'
import PrescriptionListActions from './PrescriptionListActions'

export default function PrescriptionSearch({ prescriptions }: { prescriptions: any[] }) {
    const [search, setSearch] = useState('')

    const filtered = prescriptions.filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            p.patients?.full_name?.toLowerCase().includes(q) ||
            p.diagnosis?.toLowerCase().includes(q)
        )
    })

    return (
        <div className="card">
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by patient or diagnosis..."
                        className="input pl-10 h-10 bg-white w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-slate-400">
                        <FileText size={40} className="mx-auto mb-3 opacity-20" />
                        <p>{search ? 'No matching prescriptions.' : 'No prescriptions written yet.'}</p>
                        {!search && (
                            <Link href="/doctor/appointments" className="text-[#0077B6] font-medium hover:underline mt-2 inline-block text-sm">
                                Go to Appointments to write one
                            </Link>
                        )}
                    </div>
                ) : (
                    filtered.map((p: any) => (
                        <div key={p.id} className="relative block hover:bg-slate-50 transition-colors group">
                            <Link href={`/doctor/prescriptions/${p.id}`} className="absolute inset-0 z-0">
                                <span className="sr-only">View Prescription</span>
                            </Link>
                            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 pointer-events-none">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-[#0077B6] flex items-center justify-center flex-shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{p.patients?.full_name}</p>
                                        <p className="text-xs sm:text-sm text-slate-500 truncate">Diagnosis: {p.diagnosis || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2 pl-12 sm:pl-0">
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                                        <Calendar size={13} />
                                        <span suppressHydrationWarning>{new Date(p.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex pointer-events-auto relative z-10">
                                        <PrescriptionListActions id={p.id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
