'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, Calendar, Sparkles, Mail } from 'lucide-react'

export default function PublicMobileNav() {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    // Close on escape
    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open])

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Toggle menu"
            >
                <div className="relative w-5 h-5">
                    <Menu
                        size={20}
                        className={`absolute inset-0 transition-all duration-200 ${open ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
                    />
                    <X
                        size={20}
                        className={`absolute inset-0 transition-all duration-200 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}
                    />
                </div>
            </button>

            {/* Dropdown - positioned below the header */}
            {open && (
                <div
                    className="fixed left-0 right-0 bg-white border-b border-slate-200 shadow-lg"
                    style={{
                        top: '64px', // matches h-16 mobile header
                        animation: 'slide-down 0.2s ease-out both',
                    }}
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
                        <Link
                            href="/book-online"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-[#0077B6] hover:bg-blue-50 transition-colors"
                        >
                            <Calendar size={18} className="text-[#0077B6]/60" />
                            Book Appointment
                        </Link>
                        <Link
                            href="/#features"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Sparkles size={18} className="text-slate-400" />
                            Features
                        </Link>
                        <Link
                            href="/contact"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Mail size={18} className="text-slate-400" />
                            Contact
                        </Link>
                    </div>
                </div>
            )}

            {/* Backdrop overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/10 -z-10"
                    style={{
                        top: '64px',
                        animation: 'slide-down 0.15s ease-out both',
                    }}
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    )
}
