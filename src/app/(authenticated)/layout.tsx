import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Menu, Bell, ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SignOutButton } from '@/components/SignOutButton'
import { MobileMenu } from '@/components/MobileMenu'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // PERFORMANCE FIX: Direct Admin Fetch to bypass RLS recursion lag
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Fallback or explicit error
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="p-8 bg-white rounded-lg shadow-md max-w-md text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Account Error</h2>
                    <p className="text-slate-500 mb-6">We could not load your profile. Please try logging out and back in.</p>
                    <SignOutButton />
                </div>
            </div>
        )
    }

    const role = profile.role

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">

            {/* Sidebar - DrPrax Style: White, Bordered, Clean */}
            {/* Sidebar - DrPrax Style */}
            <Sidebar role={role} profile={profile} />

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0">

                {/* Top Bar - White, Shadow-sm, Functional */}
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
                    <MobileMenu role={role} profile={profile} />

                    <div className="hidden md:flex items-center gap-4">
                        <span className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-[#0077B6] transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
                            <span>Help</span>
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

// NavItem moved to @/components/NavItem
