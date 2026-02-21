import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { MobileMenu } from '@/components/MobileMenu'
import { getUserProfile } from '@/utils/auth'
import { Activity } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getUserProfile()

    if (!profile) {
        // Use error param so proxy doesn't redirect back (prevents loop)
        redirect('/login?error=session_expired')
    }

    const role = profile.role

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">

            <div className="print:hidden">
                <Sidebar role={role} profile={profile} />
            </div>

            <div className="flex-1 md:ml-64 print:ml-0 flex flex-col min-w-0">

                {/* Top Bar */}
                <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 print:hidden">
                    {/* Mobile: hamburger + logo */}
                    <div className="flex items-center gap-3 md:hidden">
                        <MobileMenu role={role} profile={profile} />
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                                <Activity size={15} className="text-white" />
                            </div>
                            <span className="font-bold text-base tracking-tight text-slate-900 truncate">
                                {profile.clinic_name && role !== 'superadmin' ? profile.clinic_name : 'DrEase'}
                            </span>
                        </div>
                    </div>
                    {/* Desktop: date */}
                    <div className="hidden md:block">
                        <span className="text-slate-400 text-sm" suppressHydrationWarning>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    {/* Right side: welcome text (desktop) or user initial (mobile) */}
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                        <span>Welcome,</span>
                        <span className="font-medium text-slate-700">{profile.full_name?.split(' ')[0]}</span>
                    </div>
                    <div className="md:hidden text-sm font-medium text-slate-700">
                        {profile.full_name?.split(' ')[0]}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 print:p-0 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
