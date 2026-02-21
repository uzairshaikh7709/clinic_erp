import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'

export default async function OrganizationsPage() {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const { data: organizations } = await admin
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Organizations</h1>
                    <p className="text-slate-500 text-sm">Manage clinics and organizations</p>
                </div>
                <Link href="/superadmin/organizations/create" className="btn btn-primary shadow-lg shadow-blue-500/20 text-sm">
                    <Plus size={16} className="mr-1.5" /> New Org
                </Link>
            </div>

            <div className="card">
                {/* Mobile: card layout */}
                <div className="md:hidden divide-y divide-slate-100">
                    {(organizations || []).map((org) => (
                        <Link key={org.id} href={`/superadmin/organizations/${org.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 flex-shrink-0">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">{org.name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{org.slug}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${org.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {org.is_active ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        </Link>
                    ))}
                    {(!organizations || organizations.length === 0) && (
                        <div className="p-8 text-center text-slate-400">
                            No organizations yet. Create your first one.
                        </div>
                    )}
                </div>

                {/* Desktop: table layout */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-3">Organization</th>
                                <th className="px-4 lg:px-6 py-3">Slug</th>
                                <th className="px-4 lg:px-6 py-3">Status</th>
                                <th className="px-4 lg:px-6 py-3">Created</th>
                                <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(organizations || []).map((org) => (
                                <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 lg:px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{org.name}</p>
                                                <p className="text-xs text-slate-500">{org.email || 'No email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-slate-500 font-mono text-xs">{org.slug}</td>
                                    <td className="px-4 lg:px-6 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${org.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${org.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {org.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-slate-500" suppressHydrationWarning>
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 text-right">
                                        <Link
                                            href={`/superadmin/organizations/${org.id}`}
                                            className="text-slate-400 hover:text-[#0077B6] font-medium text-xs"
                                        >
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!organizations || organizations.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No organizations yet. Create your first one.
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
