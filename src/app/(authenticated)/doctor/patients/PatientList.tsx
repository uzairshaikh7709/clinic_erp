'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, User, FileText, ArrowUpDown } from 'lucide-react'
import { createWalkInAppointment } from './actions'

export default function PatientList({ patients }: { patients: any[] }) {
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<'name' | 'date'>('date')

    // Filter
    const filtered = patients.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.registration_number?.toLowerCase().includes(search.toLowerCase())
    )

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'name') {
            return a.full_name.localeCompare(b.full_name)
        }
        // Default strict order (Server sent order likely preferred, or ID)
        return 0 // Keep original order (Recency from server)
    })

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or reg no..."
                        className="input pl-10 h-10 bg-white w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSort('name')}
                        className={`btn btn-sm ${sort === 'name' ? 'btn-secondary' : 'bg-white border text-slate-600'}`}
                    >
                        <ArrowUpDown size={14} className="mr-1" /> Name
                    </button>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <User size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No patients found.</p>
                    </div>
                ) : (
                    sorted.map((p) => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold uppercase">
                                    {p.full_name?.[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{p.full_name}</p>
                                    <p className="text-xs text-slate-500">
                                        {p.gender} • {new Date().getFullYear() - new Date(p.dob).getFullYear()} Years • {p.registration_number}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Start new prescription for ${p.full_name}? This will create a walk-in appointment.`)) return;
                                        const res = await createWalkInAppointment(p.id)
                                        if (res?.success) {
                                            window.location.href = `/doctor/prescriptions/new/${res.appointmentId}`
                                        } else {
                                            // The original alert call was here.
                                            // The user's provided snippet had a different structure,
                                            // but the core instruction was to remove the alert.
                                            // To maintain syntactic correctness and align with the instruction,
                                            // the alert is removed and replaced with a console.error as implied by the snippet.
                                            const err = (res as any)?.error || 'Unknown error'
                                            console.error('Failed to create walk-in appointment:', err)
                                        }
                                    }}
                                    className="btn btn-sm btn-primary"
                                >
                                    <FileText size={14} className="mr-1" /> Write Rx
                                </button>
                                <Link href={`/doctor/prescriptions?patient=${p.id}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0077B6] hover:underline font-medium">
                                    History
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
