'use client'

import Link from 'next/link'
import { LayoutDashboard, Calendar, Users, FileText, Settings, Activity, Clock } from 'lucide-react'
import { SignOutButton } from '@/components/SignOutButton'
import { NavItem } from '@/components/NavItem'

interface SidebarProps {
    role: string
    profile: any // Typed as any to match generic profile object, or cleaner { full_name: string, ... }
}

export function Sidebar({ role, profile }: SidebarProps) {
    return (
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed inset-y-0 z-30">
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#0077B6] font-bold text-xl tracking-tight">
                    <Activity size={24} />
                    <span>OrthoClinic</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">

                <NavItem href={role === 'superadmin' ? '/superadmin/dashboard' : `/${role}/dashboard`} icon={LayoutDashboard} label="Dashboard" />

                {role === 'doctor' && (
                    <>
                        <NavItem href="/doctor/appointments" icon={Calendar} label="Appointments" />
                        <NavItem href="/doctor/patients" icon={Users} label="My Patients" />
                        <NavItem href="/doctor/prescriptions" icon={FileText} label="Prescriptions" />
                        <NavItem href="/doctor/schedule" icon={Clock} label="Schedule" />
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
                        <NavItem href="/superadmin/dashboard" icon={LayoutDashboard} label="Admin Overview" />
                        <NavItem href="/superadmin/users" icon={Users} label="User Management" />
                    </>
                )}


            </div>

            <div className="p-4 border-t border-slate-100 bg-[#F8FAFC]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold">
                        {profile?.full_name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{role}</p>
                    </div>
                </div>
                <SignOutButton />
            </div>
        </aside>
    )
}
