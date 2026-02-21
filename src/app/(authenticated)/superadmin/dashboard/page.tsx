import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Users, UserPlus, Building2, ChevronRight, Activity, Shield, Stethoscope, Mail } from 'lucide-react'

export default async function SuperAdminDashboard() {
    const profile = await requireRole(['superadmin'])
    const admin = createAdminClient()

    const [
        { count: orgCount },
        { count: activeOrgCount },
        { count: userCount },
        { count: doctorCount },
        { count: contactCount },
        { data: recentOrgs },
        { data: recentUsers },
    ] = await Promise.all([
        admin.from('organizations').select('*', { count: 'exact', head: true }),
        admin.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        admin.from('profiles').select('*', { count: 'exact', head: true }),
        admin.from('doctors').select('*', { count: 'exact', head: true }),
        admin.from('contact_submissions').select('*', { count: 'exact', head: true }),
        admin.from('organizations').select('id, name, slug, is_active, created_at').order('created_at', { ascending: false }).limit(5),
        admin.from('profiles').select('id, full_name, email, role, is_active, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Superadmin Console</h1>
                    <p className="text-slate-500 text-sm">System overview and management</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <Link href="/superadmin/organizations/create" className="btn btn-secondary text-sm">
                        <Building2 size={16} className="mr-1.5" /> New Org
                    </Link>
                    <Link href="/superadmin/users/create" className="btn btn-primary text-sm">
                        <UserPlus size={16} className="mr-1.5" /> New User
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Organizations" value={orgCount ?? 0} sub={`${activeOrgCount ?? 0} active`} icon={Building2} color="text-emerald-500" bg="bg-emerald-50" />
                <StatCard label="Total Users" value={userCount ?? 0} icon={Users} color="text-blue-500" bg="bg-blue-50" />
                <StatCard label="Doctors" value={doctorCount ?? 0} icon={Stethoscope} color="text-violet-500" bg="bg-violet-50" />
                <StatCard label="Messages" value={contactCount ?? 0} icon={Mail} color="text-amber-500" bg="bg-amber-50" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Link href="/superadmin/organizations" className="card card-hover p-4 sm:p-5 flex items-center gap-3 sm:gap-4 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} className="sm:hidden" />
                        <Building2 size={24} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">Organizations</h3>
                        <p className="text-xs sm:text-sm text-slate-500">Manage clinics</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </Link>

                <Link href="/superadmin/users" className="card card-hover p-4 sm:p-5 flex items-center gap-3 sm:gap-4 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users size={20} className="sm:hidden" />
                        <Users size={24} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">User Management</h3>
                        <p className="text-xs sm:text-sm text-slate-500">View & edit accounts</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </Link>

                <Link href="/superadmin/contacts" className="card card-hover p-4 sm:p-5 flex items-center gap-3 sm:gap-4 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <Mail size={20} className="sm:hidden" />
                        <Mail size={24} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">Contact Messages</h3>
                        <p className="text-xs sm:text-sm text-slate-500">View inquiries</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Organizations */}
                <div className="card overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">Recent Organizations</h3>
                        </div>
                        <Link href="/superadmin/organizations" className="text-sm font-medium text-indigo-600 hover:underline">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(recentOrgs || []).map((org: any) => (
                            <Link key={org.id} href={`/superadmin/organizations/${org.id}`} className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {org.name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{org.name}</p>
                                        <p className="text-xs text-slate-400 font-mono truncate">{org.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-xs font-semibold ${org.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {org.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                                </div>
                            </Link>
                        ))}
                        {(!recentOrgs || recentOrgs.length === 0) && (
                            <div className="p-8 text-center text-slate-400 text-sm">No organizations yet.</div>
                        )}
                    </div>
                </div>

                {/* Recent Users */}
                <div className="card overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">Recent Users</h3>
                        </div>
                        <Link href="/superadmin/users" className="text-sm font-medium text-indigo-600 hover:underline">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(recentUsers || []).map((user: any) => (
                            <div key={user.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {user.full_name?.[0] || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{user.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="badge badge-neutral capitalize text-[11px]">{user.role}</span>
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${user.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                </div>
                            </div>
                        ))}
                        {(!recentUsers || recentUsers.length === 0) && (
                            <div className="p-8 text-center text-slate-400 text-sm">No users yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, sub, icon: Icon, color, bg, isText }: {
    label: string; value: number | string; sub?: string; icon: any; color: string; bg: string; isText?: boolean
}) {
    return (
        <div className="card p-3 sm:p-5 flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{label}</p>
                <p className={`${isText ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-bold text-slate-900`}>{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
            </div>
        </div>
    )
}
