'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function MobileMenu({ role, profile }: { role: string; profile: any }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 z-50 md:hidden">
                        <div className="relative">
                            <Sidebar role={role} profile={profile} />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
