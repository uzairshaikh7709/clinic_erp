'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, Search, Plus, Filter, X, Calendar } from 'lucide-react'
import CertificateListActions from './CertificateListActions'

const CERTIFICATE_TYPES = [
    'All',
    'Medical Fitness Certificate',
    'Sick Leave Certificate',
    'Disability Certificate',
    'Medical Certificate',
    'Fitness to Travel Certificate',
    'Vaccination Certificate',
    'Other',
]

type Certificate = {
    id: string
    patient_name: string
    age: string
    sex: string
    certificate_type: string
    date: string
    created_at: string
}

export default function CertificateList({ certificates }: { certificates: Certificate[] }) {
    const [search, setSearch] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [typeFilter, setTypeFilter] = useState('All')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const hasActiveFilters = typeFilter !== 'All' || dateFrom || dateTo

    const clearFilters = () => {
        setTypeFilter('All')
        setDateFrom('')
        setDateTo('')
    }

    const filtered = certificates.filter(c => {
        // Text search
        if (search) {
            const q = search.toLowerCase()
            if (
                !c.patient_name.toLowerCase().includes(q) &&
                !c.certificate_type.toLowerCase().includes(q)
            ) return false
        }
        // Type filter
        if (typeFilter !== 'All' && c.certificate_type !== typeFilter) return false
        // Date range
        if (dateFrom && c.date < dateFrom) return false
        if (dateTo && c.date > dateTo) return false
        return true
    })

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Award size={20} className="text-slate-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Certifications</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Manage medical certificates</p>
                </div>
                <Link href="/doctor/certifications/new" className="btn btn-primary">
                    <Plus size={18} className="mr-1.5" /> New Certificate
                </Link>
            </div>

            <div className="card">
                {/* Search & Filter Bar */}
                <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by patient name or type..."
                            className="input pl-10 h-10 bg-white w-full"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn btn-sm ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5`}
                    >
                        <Filter size={14} />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">!</span>
                        )}
                    </button>
                </div>

                {/* Collapsible Filters */}
                {showFilters && (
                    <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-end gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                            <select
                                className="select h-9 text-sm"
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                            >
                                {CERTIFICATE_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">From</label>
                            <input
                                type="date"
                                className="input h-9 text-sm"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">To</label>
                            <input
                                type="date"
                                className="input h-9 text-sm"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn btn-sm btn-ghost text-slate-500 flex items-center gap-1">
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>
                )}

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center text-slate-400">
                            <Award size={40} className="mx-auto mb-3 opacity-20" />
                            <p>{search || hasActiveFilters ? 'No matching certificates.' : 'No certificates created yet.'}</p>
                            {!search && !hasActiveFilters && (
                                <Link href="/doctor/certifications/new" className="text-[#0077B6] font-medium hover:underline mt-2 inline-block text-sm">
                                    Create your first certificate
                                </Link>
                            )}
                        </div>
                    ) : (
                        filtered.map(c => (
                            <div key={c.id} className="relative block hover:bg-slate-50 transition-colors group">
                                <Link href={`/doctor/certifications/${c.id}`} className="absolute inset-0 z-0">
                                    <span className="sr-only">View Certificate</span>
                                </Link>
                                <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 pointer-events-none">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                            <Award size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{c.patient_name}</p>
                                            <p className="text-xs sm:text-sm text-slate-500 truncate">
                                                {c.certificate_type} &middot; {c.age}Y / {c.sex}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-2 pl-12 sm:pl-0">
                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                                            <Calendar size={13} />
                                            <span suppressHydrationWarning>
                                                {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex pointer-events-auto relative z-10">
                                            <CertificateListActions id={c.id} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
