'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

export function SignOutButton() {
    return (
        <form action={signOut} className="w-full">
            <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
                <LogOut size={12} />
                Log Out
            </button>
        </form>
    )
}
