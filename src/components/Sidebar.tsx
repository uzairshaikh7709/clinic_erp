'use client'

import { LayoutDashboard, Calendar, Users, FileText, Activity, Clock, Building2, UserCog, Mail, Globe } from 'lucide-react'
import { SignOutButton } from '@/components/SignOutButton'
import { NavItem } from '@/components/NavItem'

interface SidebarProps {
    role: string
    profile: any
}

export function Sidebar({ role, profile }: SidebarProps) {
    return (
        <aside className="w-64 bg-slate-900 hidden md:flex flex-col fixed inset-y-0 z-30">
            {/* Brand */}
            <div className="h-16 flex items-center px-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Activity size={18} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight truncate">
                        {profile?.clinic_name && role !== 'superadmin' ? profile.clinic_name : 'DrEase'}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>

                <NavItem href={role === 'superadmin' ? '/superadmin/dashboard' : `/${role}/dashboard`} icon={LayoutDashboard} label="Dashboard" />

                {role === 'doctor' && (
                    <>
                        <NavItem href="/doctor/appointments" icon={Calendar} label="Appointments" />
                        <NavItem href="/doctor/patients" icon={Users} label="My Patients" />
                        <NavItem href="/doctor/templates" icon={FileText} label="Templates" />
                        <NavItem href="/doctor/schedule" icon={Clock} label="Schedule" />
                        {profile?.is_clinic_owner && (
                            <>
                                <div className="pt-3 pb-1">
                                    <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Management</p>
                                </div>
                                <NavItem href="/doctor/team" icon={UserCog} label="Team" />
                                <NavItem href="/doctor/clinic" icon={Globe} label="Clinic Page" />
                            </>
                        )}
                    </>
                )}

                {role === 'assistant' && (
                    <>
                        <NavItem href="/assistant/appointments" icon={Calendar} label="Schedule" />
                        <NavItem href="/assistant/patients" icon={Users} label="Patient Registry" />
                    </>
                )}

                {(role === 'patient' || role === 'user') && (
                    <>
                        <NavItem href="/book" icon={Calendar} label="Book Appointment" />
                        <NavItem href="/patient/prescriptions" icon={FileText} label="My Prescriptions" />
                    </>
                )}

                {role === 'superadmin' && (
                    <>
                        <NavItem href="/superadmin/organizations" icon={Building2} label="Organizations" />
                        <NavItem href="/superadmin/users" icon={Users} label="User Management" />
                        <NavItem href="/superadmin/contacts" icon={Mail} label="Contact Messages" />
                    </>
                )}
            </div>

            {/* Profile footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
                        {profile?.full_name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{profile?.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{role}</p>
                    </div>
                </div>
                <SignOutButton />
            </div>
        </aside>
    )
}
