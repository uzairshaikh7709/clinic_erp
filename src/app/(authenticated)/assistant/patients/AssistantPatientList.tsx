'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createBrowserClient } from '@/utils/supabase/client'
import { Search, User, Phone, Pencil, X, Save, Loader2, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

function EditPatientModal({ patient, onClose }: { patient: any; onClose: () => void }) {
    const supabase = createBrowserClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const [form, setForm] = useState({
        full_name: patient.full_name || '',
        dob: patient.dob || '',
        gender: patient.gender || 'Male',
        phone: patient.phone || '',
        address: patient.address || '',
    })

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.full_name.trim()) { setError('Name is required'); return }
        setLoading(true)
        setError(null)

        const { error: err } = await supabase
            .from('patients')
            .update({
                full_name: form.full_name.trim(),
                dob: form.dob || null,
                gender: form.gender,
                phone: form.phone || null,
                address: form.address || null,
            })
            .eq('id', patient.id)

        setLoading(false)
        if (err) { setError(err.message) }
        else { router.refresh(); onClose() }
    }

    return createPortal(
        <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
            style={{ animation: 'fade-in 0.15s ease-out' }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                style={{ animation: 'slide-up 0.2s ease-out' }}
            >
                <button onClick={onClose} className="absolute right-3 top-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors z-10">
                    <X size={16} />
                </button>

                <div className="pt-6 pb-4 px-5 text-center border-b border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg mx-auto mb-2">
                        {form.full_name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <p className="font-bold text-slate-800">Edit Patient</p>
                    <p className="text-xs text-slate-400">{patient.registration_number}</p>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</label>
                        <input
                            type="text"
                            required
                            className="input h-10 text-sm w-full"
                            value={form.full_name}
                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date of Birth</label>
                            <input
                                type="date"
                                className="input h-10 text-sm w-full"
                                value={form.dob}
                                onChange={e => setForm({ ...form, dob: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gender</label>
                            <select
                                className="input h-10 text-sm w-full"
                                value={form.gender}
                                onChange={e => setForm({ ...form, gender: e.target.value })}
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
                        <input
                            type="tel"
                            className="input h-10 text-sm w-full"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</label>
                        <textarea
                            className="input text-sm w-full min-h-[70px] py-2"
                            placeholder="Street, City..."
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="btn btn-secondary flex-1 h-9 text-sm" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary flex-1 h-9 text-sm" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={15} /> : <><Save size={14} className="mr-1" /> Save</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}

export default function AssistantPatientList({ patients }: { patients: any[] }) {
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<'name' | 'date'>('date')
    const [editing, setEditing] = useState<any>(null)

    const filtered = patients.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
    )

    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'name') return (a.full_name || '').localeCompare(b.full_name || '')
        return 0
    })

    return (
        <>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, reg no, or phone..."
                            className="input pl-10 h-10 bg-white w-full"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setSort(s => s === 'name' ? 'date' : 'name')}
                        className={`btn btn-sm ${sort === 'name' ? 'btn-secondary' : 'bg-white border text-slate-600'}`}
                    >
                        <ArrowUpDown size={14} className="mr-1" /> Name
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {sorted.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <User size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No patients found.</p>
                        </div>
                    ) : (
                        sorted.map((p) => (
                            <div key={p.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 flex-shrink-0 text-sm uppercase">
                                        {p.full_name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{p.full_name}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {p.registration_number} {p.gender && `• ${p.gender}`}
                                            {p.dob && ` • ${new Date().getFullYear() - new Date(p.dob).getFullYear()}y`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-12 sm:pl-0 flex-shrink-0">
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
                                    <button
                                        onClick={() => setEditing(p)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                                    >
                                        <Pencil size={13} /> Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {editing && <EditPatientModal patient={editing} onClose={() => setEditing(null)} />}
        </>
    )
}
