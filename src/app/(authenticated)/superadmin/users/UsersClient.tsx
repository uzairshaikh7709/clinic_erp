'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, User, Shield, Stethoscope } from 'lucide-react'
import EditUserModal from './EditUserModal'
import { useRouter } from 'next/navigation'

export default function UsersClient({ initialProfiles }: { initialProfiles: any[] }) {
    const router = useRouter()
    const [editingUser, setEditingUser] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const handleCloseModal = () => {
        setEditingUser(null)
        router.refresh() // Refresh server data
    }

    // Client-side Filter
    const filteredProfiles = initialProfiles.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {editingUser && <EditUserModal user={editingUser} onClose={handleCloseModal} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-slate-500 text-sm">Manage system access for Doctors and Assistants</p>
                </div>
                <Link href="/superadmin/users/create" className="btn btn-primary shadow-lg shadow-blue-500/20">
                    <Plus size={18} className="mr-2" /> Add New User
                </Link>
            </div>

            <div className="card">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            className="input pl-10 h-10 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(filteredProfiles || []).map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                {user.full_name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.full_name || 'No Name'}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {user.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500" suppressHydrationWarning>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="text-slate-400 hover:text-[#0077B6] font-medium text-xs cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function Badge({ role }: { role: string }) {
    if (role === 'doctor') {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100"><Stethoscope size={12} /> Doctor</span>
    }
    if (role === 'superadmin') {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-100"><Shield size={12} /> Admin</span>
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200"><User size={12} /> Assistant</span>
}
