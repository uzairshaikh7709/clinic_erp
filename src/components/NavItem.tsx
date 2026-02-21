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

    const isDashboard = href.endsWith('/dashboard')
    const isActive = isDashboard
        ? pathname === href
        : pathname.startsWith(href)

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
        >
            <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
            {label}
        </Link>
    )
}
