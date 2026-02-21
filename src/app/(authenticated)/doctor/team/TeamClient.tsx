'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Stethoscope, User, Trash2 } from 'lucide-react'
import EditStaffModal from './EditStaffModal'
import { removeStaffFromClinic } from './actions'
import BookingLinkCard from '@/components/BookingLinkCard'

type Member = {
    id: string
    email: string
    full_name: string | null
    role: string
    is_active: boolean
    created_at: string
}

export default function TeamClient({ members, ownerId, orgSlug, orgName, isOwner }: { members: Member[]; ownerId: string; orgSlug: string; orgName: string; isOwner: boolean }) {
    const router = useRouter()
    const [editingUser, setEditingUser] = useState<Member | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [removing, setRemoving] = useState<string | null>(null)

    const handleCloseModal = () => {
        setEditingUser(null)
        router.refresh()
    }

    const handleRemove = async (profileId: string) => {
        if (profileId === ownerId) return
        setRemoving(profileId)
        const formData = new FormData()
        formData.append('profile_id', profileId)
        const result = await removeStaffFromClinic(formData)
        if (result.error) {
            setRemoving(null)
        } else {
            router.refresh()
        }
    }

    const filtered = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-enter">
            {editingUser && <EditStaffModal user={editingUser} ownerId={ownerId} onClose={handleCloseModal} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{isOwner ? 'Team Management' : 'My Assistants'}</h1>
                    <p className="text-slate-500 text-sm">{isOwner ? 'Manage doctors and assistants in your clinic' : 'Manage assistants assigned to you'}</p>
                </div>
                <Link href="/doctor/team/create" className="btn btn-primary shadow-lg shadow-blue-500/20 text-sm">
                    <Plus size={16} className="mr-1.5" /> {isOwner ? 'Add Staff' : 'Add Assistant'}
                </Link>
            </div>

            {isOwner && orgSlug && <BookingLinkCard slug={orgSlug} orgName={orgName} />}

            <div className="card">
                <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="input pl-10 h-10 bg-white w-full"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile: card layout */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filtered.map(member => (
                        <div key={member.id} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 flex-shrink-0">
                                        {member.full_name?.[0] || member.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">
                                            {member.full_name || 'No Name'}
                                            {member.id === ownerId && (
                                                <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">Owner</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                    </div>
                                </div>
                                {member.id !== ownerId && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => setEditingUser(member)}
                                            className="text-slate-400 hover:text-[#0077B6] font-medium text-xs cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                disabled={removing === member.id}
                                                className="text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pl-12 flex-wrap">
                                <RoleBadge role={member.role} />
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {member.is_active ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No team members found.
                        </div>
                    )}
                </div>

                {/* Desktop: table layout */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-3">Member</th>
                                <th className="px-4 lg:px-6 py-3">Role</th>
                                <th className="px-4 lg:px-6 py-3">Status</th>
                                <th className="px-4 lg:px-6 py-3">Joined</th>
                                <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 lg:px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                {member.full_name?.[0] || member.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {member.full_name || 'No Name'}
                                                    {member.id === ownerId && (
                                                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Owner</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3">
                                        <RoleBadge role={member.role} />
                                    </td>
                                    <td className="px-4 lg:px-6 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {member.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-slate-500" suppressHydrationWarning>
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-right">
                                        {member.id !== ownerId && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser(member)}
                                                    className="text-slate-400 hover:text-[#0077B6] font-medium text-xs cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleRemove(member.id)}
                                                        disabled={removing === member.id}
                                                        className="text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No team members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function RoleBadge({ role }: { role: string }) {
    if (role === 'doctor') {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100"><Stethoscope size={12} /> Doctor</span>
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200"><User size={12} /> Assistant</span>
}
