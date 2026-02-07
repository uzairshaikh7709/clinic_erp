'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface NavItemProps {
    href: string
    icon: LucideIcon
    label: string
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
    const pathname = usePathname()
    // Active if exact match or starts with (for nested), preventing partial matches like /doctor vs /doctor-who (not issue here)
    // Simple check:
    const isActive = pathname === href || (pathname.startsWith(href) && href !== '/doctor/dashboard' && href !== '/assistant/dashboard' && href !== '/superadmin/dashboard')

    // Actually, for dashboard, we want exact match potentially, or handled carefully. 
    // If href is /doctor/appointments, and path is /doctor/appointments/new, it should be active.
    // If href is /doctor/dashboard, and path is /doctor/dashboard, active.

    // Improved logic:
    const activeState =
        (href === '/doctor/dashboard' && pathname === '/doctor/dashboard') ||
        (href === '/assistant/dashboard' && pathname === '/assistant/dashboard') ||
        (href === '/superadmin/dashboard' && pathname === '/superadmin/dashboard') ||
        (href !== '/doctor/dashboard' && href !== '/assistant/dashboard' && href !== '/superadmin/dashboard' && pathname.startsWith(href))

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all group cursor-pointer ${activeState
                ? 'bg-[#0077B6] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-blue-50 hover:text-[#0077B6]'
                }`}
        >
            <Icon
                size={18}
                className={`transition-colors ${activeState ? 'text-white' : 'text-slate-400 group-hover:text-[#0077B6]'}`}
            />
            {label}
        </Link>
    )
}
