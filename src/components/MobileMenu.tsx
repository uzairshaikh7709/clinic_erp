'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Menu, X, LayoutDashboard, Calendar, Users, FileText,
    Clock, Building2, UserCog, LogOut, LucideIcon, Mail, Globe, Award
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'

function MobileNavItem({ href, icon: Icon, label, onClick }: { href: string; icon: LucideIcon; label: string; onClick: () => void }) {
    const pathname = usePathname()
    const isDashboard = href.endsWith('/dashboard')
    const isActive = isDashboard ? pathname === href : pathname.startsWith(href)

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
            <Icon size={18} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
            {label}
        </Link>
    )
}

export function MobileMenu({ role, profile }: { role: string; profile: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    // Close on route change
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isOpen])

    // Close on escape
    useEffect(() => {
        if (!isOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [isOpen])

    const close = () => setIsOpen(false)

    const dashboardHref = role === 'superadmin' ? '/superadmin/dashboard' : `/${role}/dashboard`

    return (
        <div ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                aria-label="Toggle menu"
            >
                <div className="relative w-6 h-6">
                    <Menu
                        size={24}
                        className={`absolute inset-0 transition-all duration-200 ${isOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
                    />
                    <X
                        size={24}
                        className={`absolute inset-0 transition-all duration-200 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}
                    />
                </div>
            </button>

            {/* Dropdown menu — opens below header */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        style={{ top: '56px', animation: 'slide-down 0.15s ease-out both' }}
                        onClick={close}
                    />

                    {/* Menu panel */}
                    <div
                        className="fixed left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-xl max-h-[calc(100vh-56px)] overflow-y-auto"
                        style={{ top: '56px', animation: 'slide-down 0.2s ease-out both' }}
                    >
                        <div className="px-4 py-3 space-y-1">
                            <p className="px-3 pt-1 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Menu</p>

                            <MobileNavItem href={dashboardHref} icon={LayoutDashboard} label="Dashboard" onClick={close} />

                            {role === 'doctor' && (
                                <>
                                    <MobileNavItem href="/doctor/appointments" icon={Calendar} label="Appointments" onClick={close} />
                                    <MobileNavItem href="/doctor/patients" icon={Users} label="My Patients" onClick={close} />
                                    <MobileNavItem href="/doctor/templates" icon={FileText} label="Templates" onClick={close} />
                                    <MobileNavItem href="/doctor/schedule" icon={Clock} label="Schedule" onClick={close} />
                                    <MobileNavItem href="/doctor/certifications" icon={Award} label="Certifications" onClick={close} />
                                    <div className="pt-3 pb-1">
                                        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Management</p>
                                    </div>
                                    <MobileNavItem href="/doctor/team" icon={UserCog} label={profile?.is_clinic_owner ? 'Team' : 'My Staff'} onClick={close} />
                                    <MobileNavItem href="/doctor/clinic" icon={Globe} label="Clinic" onClick={close} />
                                </>
                            )}

                            {role === 'assistant' && (
                                <>
                                    <MobileNavItem href="/assistant/appointments" icon={Calendar} label="Schedule" onClick={close} />
                                    <MobileNavItem href="/assistant/patients" icon={Users} label="Patient Registry" onClick={close} />
                                </>
                            )}

                            {(role === 'patient' || role === 'user') && (
                                <>
                                    <MobileNavItem href="/book" icon={Calendar} label="Book Appointment" onClick={close} />
                                    <MobileNavItem href="/patient/prescriptions" icon={FileText} label="My Prescriptions" onClick={close} />
                                </>
                            )}

                            {role === 'superadmin' && (
                                <>
                                    <MobileNavItem href="/superadmin/organizations" icon={Building2} label="Organizations" onClick={close} />
                                    <MobileNavItem href="/superadmin/users" icon={Users} label="User Management" onClick={close} />
                                    <MobileNavItem href="/superadmin/contacts" icon={Mail} label="Contact Messages" onClick={close} />
                                </>
                            )}
                        </div>

                        {/* User + sign out */}
                        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                                    {profile?.full_name?.[0] || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{profile?.full_name}</p>
                                    <p className="text-xs text-slate-400 capitalize">{role}</p>
                                </div>
                            </div>
                            <form action={signOut}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                >
                                    <LogOut size={14} />
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
