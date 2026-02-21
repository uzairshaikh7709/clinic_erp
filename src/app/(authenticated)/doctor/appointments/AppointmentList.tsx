'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowUpDown, Filter, X, Clock, Phone, Calendar } from 'lucide-react'
import CancelButton from './CancelButton'

export default function AppointmentList({ appointments }: { appointments: any[] }) {
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<'recent' | 'oldest'>('recent')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [showFilters, setShowFilters] = useState(false)
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
    let filtered = appointments.filter(apt => {
        const name = apt.patients?.full_name?.toLowerCase() || ''
        const phone = apt.patients?.phone || ''
        const q = search.toLowerCase()
        return name.includes(q) || phone.includes(q)
    })

    // Status filter
    if (statusFilter) {
        filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    // Date range filter
    if (dateFrom || dateTo) {
        filtered = filtered.filter(apt => {
            const d = new Date(apt.start_time)
            if (dateFrom && d < new Date(dateFrom)) return false
            if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
            return true
        })
    }

    // Type filter
    if (typeFilter !== 'all') {
        filtered = filtered.filter(apt => apt.appointment_type === typeFilter)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'oldest') return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    })

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Appointments</h1>
                    <p className="text-slate-500 text-sm">Manage your schedule and patient visits</p>
                </div>
                {/* Status Tabs */}
                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                    <button onClick={() => setStatusFilter('')} className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${!statusFilter ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                        All
                    </button>
                    <button onClick={() => setStatusFilter('booked')} className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${statusFilter === 'booked' ? 'bg-blue-50 text-[#0077B6]' : 'text-slate-500 hover:text-slate-800'}`}>
                        Upcoming
                    </button>
                    <button onClick={() => setStatusFilter('completed')} className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${statusFilter === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        Completed
                    </button>
                </div>
            </div>

            {/* Search + Sort + Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search patient name, phone..."
                            className="input pl-10 h-10 bg-white w-full"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSort(sort === 'recent' ? 'oldest' : 'recent')}
                            className={`btn btn-sm ${sort === 'oldest' ? 'btn-secondary' : 'bg-white border text-slate-600'}`}
                        >
                            <ArrowUpDown size={14} className="mr-1" /> {sort === 'recent' ? 'Recent' : 'Oldest'}
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
                            <label className="text-xs font-medium text-slate-500 mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input h-9 text-sm w-full sm:w-36" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input h-9 text-sm w-full sm:w-36" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
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

            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
                {sorted.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                        <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                        <p>{search || hasActiveFilters ? 'No appointments match your filters.' : 'No appointments found.'}</p>
                    </div>
                ) : (
                    sorted.map((apt: any) => (
                        <div key={apt.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0077B6] flex items-center justify-center font-bold text-xs">
                                        {apt.patients?.full_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm">{apt.patients?.full_name}</p>
                                        <p className="text-xs text-slate-500">{apt.patients?.gender}, {new Date().getFullYear() - new Date(apt.patients?.dob || '2000').getFullYear()}y</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize
                                    ${apt.status === 'booked' ? 'bg-blue-50 text-blue-700' :
                                        apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                            apt.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                'bg-slate-100 text-slate-600'
                                    }`}>
                                    {apt.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={13} />
                                    {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(apt.start_time).toLocaleDateString()}
                                </span>
                                <AppointmentTypeBadge type={apt.appointment_type} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {apt.status === 'booked' && (
                                    <Link href={`/doctor/prescriptions/new/${apt.id}`} className="btn btn-xs btn-primary">
                                        Start Visit
                                    </Link>
                                )}
                                {apt.patients?.phone && (
                                    <a
                                        href={`https://wa.me/${apt.patients.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    >
                                        <Phone size={13} />
                                        {apt.patients.phone}
                                    </a>
                                )}
                                {apt.status === 'booked' && (
                                    <CancelButton appointmentId={apt.id} />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-3">Time</th>
                                <th className="px-4 lg:px-6 py-3">Patient</th>
                                <th className="px-4 lg:px-6 py-3">Type</th>
                                <th className="px-4 lg:px-6 py-3">Status</th>
                                <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        {search || hasActiveFilters ? 'No appointments match your filters.' : 'No appointments found.'}
                                    </td>
                                </tr>
                            ) : (
                                sorted.map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 lg:px-6 py-3 font-medium text-slate-700 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">
                                                    {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(apt.start_time).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3">
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
                                        <td className="px-4 lg:px-6 py-3">
                                            <AppointmentTypeBadge type={apt.appointment_type} />
                                        </td>
                                        <td className="px-4 lg:px-6 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                                ${apt.status === 'booked' ? 'bg-blue-50 text-blue-700' :
                                                    apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        apt.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                            'bg-slate-100 text-slate-600'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {apt.status === 'booked' && (
                                                    <Link href={`/doctor/prescriptions/new/${apt.id}`} className="btn btn-xs btn-primary">
                                                        Start Visit
                                                    </Link>
                                                )}
                                                {apt.patients?.phone && (
                                                    <a
                                                        href={`https://wa.me/${apt.patients.phone.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                        title="WhatsApp"
                                                    >
                                                        <Phone size={13} />
                                                        {apt.patients.phone}
                                                    </a>
                                                )}
                                                {apt.status === 'booked' && (
                                                    <CancelButton appointmentId={apt.id} />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function AppointmentTypeBadge({ type }: { type?: string }) {
    if (type === 'online') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">Online</span>
    if (type === 'walk_in') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Walk-in</span>
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">In-clinic</span>
}
