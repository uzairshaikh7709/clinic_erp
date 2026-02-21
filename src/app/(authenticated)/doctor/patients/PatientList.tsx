'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, User, FileText, ArrowUpDown, Phone, Loader2, Filter, X } from 'lucide-react'
import { createWalkInAppointment } from './actions'

function WalkInButton({ patientId, patientName }: { patientId: string; patientName: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleClick = async () => {
        setLoading(true)
        setError(null)
        const res = await createWalkInAppointment(patientId)
        if (res?.success) {
            window.location.href = `/doctor/prescriptions/new/${res.appointmentId}`
        } else {
            setError((res as any)?.error || 'Failed to create appointment')
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button onClick={handleClick} disabled={loading} className="btn btn-sm btn-primary">
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <FileText size={14} className="mr-1" />}
                Write Rx
            </button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    )
}

export default function PatientList({ patients }: { patients: any[] }) {
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<'name' | 'date'>('date')
    const [showFilters, setShowFilters] = useState(false)
    const [dateField, setDateField] = useState<'last_visit' | 'registered'>('last_visit')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'walk_in'>('all')

    const hasActiveFilters = dateFrom || dateTo || typeFilter !== 'all'

    const clearFilters = () => {
        setDateFrom('')
        setDateTo('')
        setTypeFilter('all')
    }

    // Text search
    let filtered = patients.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search) ||
        p.address?.toLowerCase().includes(search.toLowerCase())
    )

    // Date filter
    if (dateFrom || dateTo) {
        filtered = filtered.filter(p => {
            const dateValue = dateField === 'last_visit' ? p.last_visit_date : p.created_at
            if (!dateValue) return false
            const d = new Date(dateValue)
            if (dateFrom && d < new Date(dateFrom)) return false
            if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
            return true
        })
    }

    // Type filter
    if (typeFilter !== 'all') {
        filtered = filtered.filter(p =>
            p.appointment_types?.includes(typeFilter)
        )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'name') return (a.full_name || '').localeCompare(b.full_name || '')
        return 0
    })

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Search + Sort Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search name, phone, address..."
                            className="input pl-10 h-10 bg-white w-full"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSort(sort === 'name' ? 'date' : 'name')}
                            className={`btn btn-sm ${sort === 'name' ? 'btn-secondary' : 'bg-white border text-slate-600'}`}
                        >
                            <ArrowUpDown size={14} className="mr-1" /> {sort === 'name' ? 'A-Z' : 'Recent'}
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn btn-sm ${showFilters || hasActiveFilters ? 'btn-primary' : 'bg-white border text-slate-600'}`}
                        >
                            <Filter size={14} className="mr-1" /> Filters
                            {hasActiveFilters && <span className="ml-1 w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center">!</span>}
                        </button>
                    </div>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-slate-200 animate-enter">
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Date Type</label>
                            <select value={dateField} onChange={e => setDateField(e.target.value as any)} className="select h-9 text-sm w-full sm:w-36">
                                <option value="last_visit">Last Visit</option>
                                <option value="registered">Registered</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input h-9 text-sm w-full sm:w-36" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input h-9 text-sm w-full sm:w-36" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Visit Type</label>
                            <div className="flex gap-1">
                                {(['all', 'online', 'walk_in'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTypeFilter(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                                            typeFilter === t
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {t === 'walk_in' ? 'Walk-in' : t === 'all' ? 'All' : 'Online'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn btn-sm btn-ghost text-red-500 hover:text-red-700">
                                <X size={14} className="mr-1" /> Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Patient List */}
            <div className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <User size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No patients found.</p>
                    </div>
                ) : (
                    sorted.map((p) => (
                        <div key={p.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors group">
                            <Link href={`/doctor/patients/${p.id}`} className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold uppercase flex-shrink-0 text-sm">
                                    {p.full_name?.[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">{p.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {p.gender} • {p.dob ? `${new Date().getFullYear() - new Date(p.dob).getFullYear()}y` : ''} • {p.registration_number}
                                    </p>
                                </div>
                            </Link>
                            <div className="flex items-center gap-2 sm:gap-3 pl-12 sm:pl-0 flex-shrink-0 flex-wrap">
                                {p.visit_count > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        {p.visit_count} visit{p.visit_count > 1 ? 's' : ''}
                                    </span>
                                )}
                                {p.phone && (
                                    <a
                                        href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                        title="WhatsApp"
                                    >
                                        <Phone size={13} />
                                        <span className="hidden sm:inline">{p.phone}</span>
                                    </a>
                                )}
                                <WalkInButton patientId={p.id} patientName={p.full_name} />
                                <Link href={`/doctor/patients/${p.id}`} className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#0077B6] hover:underline font-medium">
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
