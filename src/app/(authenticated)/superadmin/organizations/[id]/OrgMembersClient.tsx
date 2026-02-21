'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Users, Plus, X, Loader2, Stethoscope, User } from 'lucide-react'
import { addMemberToOrg, removeMemberFromOrg, createUserForOrg } from './actions'

type Member = {
    id: string
    email: string
    full_name: string | null
    role: string
    is_active: boolean
}

type OrgDoctor = {
    id: string
    profile_id: string
    profiles: { full_name: string | null } | null
}

export default function OrgMembersClient({
    members,
    orgId,
    unassignedUsers,
    orgDoctors
}: {
    members: Member[]
    orgId: string
    unassignedUsers: Member[]
    orgDoctors: OrgDoctor[]
}) {
    const router = useRouter()
    const [showModal, setShowModal] = useState(false)
    const [removing, setRemoving] = useState<string | null>(null)

    const handleRemove = async (profileId: string) => {
        setRemoving(profileId)
        const formData = new FormData()
        formData.append('profile_id', profileId)
        formData.append('org_id', orgId)
        const result = await removeMemberFromOrg(formData)
        if (result.error) {
            setRemoving(null)
        } else {
            router.refresh()
            setRemoving(null)
        }
    }

    return (
        <div className="card">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-800">Members ({members.length})</h2>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary text-sm"
                >
                    <Plus size={15} className="mr-1" /> Add Member
                </button>
            </div>

            {/* Mobile: card layout */}
            <div className="md:hidden divide-y divide-slate-100">
                {members.map((m) => (
                    <div key={m.id} className="p-4 flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{m.full_name || '—'}</p>
                            <p className="text-xs text-slate-500 truncate">{m.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs capitalize text-slate-600">{m.role}</span>
                                <span className={`text-xs font-semibold ${m.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {m.is_active ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemove(m.id)}
                            disabled={removing === m.id}
                            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 flex-shrink-0"
                        >
                            {removing === m.id ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
                        </button>
                    </div>
                ))}
                {members.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        No members assigned to this organization.
                    </div>
                )}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-4 lg:px-6 py-3">Name</th>
                            <th className="px-4 lg:px-6 py-3">Email</th>
                            <th className="px-4 lg:px-6 py-3">Role</th>
                            <th className="px-4 lg:px-6 py-3">Status</th>
                            <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {members.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                                <td className="px-4 lg:px-6 py-3 font-medium text-slate-900">{m.full_name || '—'}</td>
                                <td className="px-4 lg:px-6 py-3 text-slate-500">{m.email}</td>
                                <td className="px-4 lg:px-6 py-3 capitalize text-slate-600">{m.role}</td>
                                <td className="px-4 lg:px-6 py-3">
                                    <span className={`text-xs font-semibold ${m.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {m.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-4 lg:px-6 py-3 text-right">
                                    <button
                                        onClick={() => handleRemove(m.id)}
                                        disabled={removing === m.id}
                                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                                    >
                                        {removing === m.id ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    No members assigned to this organization.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddMemberModal
                    orgId={orgId}
                    unassignedUsers={unassignedUsers}
                    orgDoctors={orgDoctors}
                    onClose={() => { setShowModal(false); router.refresh() }}
                />
            )}
        </div>
    )
}

function AddMemberModal({
    orgId,
    unassignedUsers,
    orgDoctors,
    onClose
}: {
    orgId: string
    unassignedUsers: Member[]
    orgDoctors: OrgDoctor[]
    onClose: () => void
}) {
    const [tab, setTab] = useState<'existing' | 'new'>('existing')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const backdropRef = useRef<HTMLDivElement>(null)

    // Assign existing
    const [selectedUserId, setSelectedUserId] = useState('')

    // Create new
    const [role, setRole] = useState('doctor')

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleAssignExisting = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUserId) return
        setLoading(true)
        setError(null)
        setSuccess(null)

        const formData = new FormData()
        formData.append('org_id', orgId)
        formData.append('profile_id', selectedUserId)

        const result = await addMemberToOrg(formData)
        setLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setSuccess('User assigned successfully!')
            setSelectedUserId('')
        }
    }

    const handleCreateNew = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        setLoading(true)
        setError(null)
        setSuccess(null)

        const formData = new FormData(form)
        formData.append('org_id', orgId)

        const result = await createUserForOrg(formData)
        setLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setSuccess('User created and added successfully!')
            form.reset()
            setRole('doctor')
        }
    }

    return createPortal(
        <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
            style={{ animation: 'fade-in 0.15s ease-out' }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
                style={{ animation: 'slide-up 0.2s ease-out' }}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <h2 className="font-bold text-slate-800 text-base">Add Member</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 flex-shrink-0">
                    <button
                        onClick={() => { setTab('existing'); setError(null); setSuccess(null) }}
                        className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${tab === 'existing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Assign Existing
                    </button>
                    <button
                        onClick={() => { setTab('new'); setError(null); setSuccess(null) }}
                        className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${tab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Create New
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 overflow-y-auto">
                    {success && (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg text-sm mb-4">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm mb-4">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}

                    {tab === 'existing' ? (
                        <form onSubmit={handleAssignExisting} className="space-y-4">
                            <div>
                                <label className="label">Select User</label>
                                {unassignedUsers.length > 0 ? (
                                    <select
                                        className="select"
                                        value={selectedUserId}
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose a user...</option>
                                        {unassignedUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.full_name || u.email} ({u.role}) — {u.email}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-slate-400 py-2">No unassigned users available.</p>
                                )}
                            </div>
                            {unassignedUsers.length > 0 && (
                                <button type="submit" className="btn btn-primary w-full" disabled={loading || !selectedUserId}>
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Assign to Organization'}
                                </button>
                            )}
                        </form>
                    ) : (
                        <form onSubmit={handleCreateNew} className="space-y-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input name="full_name" required className="input" placeholder="Dr. John Smith" />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input name="email" type="email" required className="input" placeholder="john@clinic.com" />
                            </div>
                            <div>
                                <label className="label">Password</label>
                                <input name="password" type="password" required minLength={8} className="input" placeholder="Min 8 characters" />
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRole('doctor')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${role === 'doctor' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <Stethoscope size={14} /> Doctor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('assistant')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${role === 'assistant' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <User size={14} /> Assistant
                                    </button>
                                </div>
                                <input type="hidden" name="role" value={role} />
                            </div>

                            {role === 'doctor' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label">Registration No.</label>
                                        <input name="registration_number" className="input" placeholder="REG-001" />
                                    </div>
                                    <div>
                                        <label className="label">Specialization</label>
                                        <input name="specialization" className="input" placeholder="Orthopedics" />
                                    </div>
                                </div>
                            )}

                            {role === 'assistant' && orgDoctors.length > 0 && (
                                <div>
                                    <label className="label">Assigned Doctor</label>
                                    <select name="assigned_doctor_id" className="select">
                                        <option value="">None (assign later)</option>
                                        {orgDoctors.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.profiles?.full_name || 'Unnamed Doctor'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create & Add to Organization'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
