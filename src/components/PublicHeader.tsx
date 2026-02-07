import Link from 'next/link'
import { Activity } from 'lucide-react'
import { getUserProfile } from '@/utils/auth'

export default async function PublicHeader() {
    const profile = await getUserProfile()

    return (
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-slate-100 h-20 items-center flex">
            <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    {/* Logo Mark */}
                    <div className="w-8 h-8 rounded-lg bg-[#0077B6] flex items-center justify-center text-white">
                        <Activity size={20} strokeWidth={2.5} />
                    </div>
                    <Link href="/" className="font-bold text-xl tracking-tight text-[#0077B6]">OrthoClinic</Link>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <Link href="/book-online" className="text-[#0077B6] font-semibold hover:text-[#023e8a] transition-colors">Book Appointment</Link>
                    <Link href="/#features" className="hover:text-[#0077B6] transition-colors">Features</Link>
                    <Link href="/#pricing" className="hover:text-[#0077B6] transition-colors">Pricing</Link>
                </div>

                <div className="flex items-center gap-4">
                    {profile ? (
                        <Link
                            href={['patient', 'user'].includes(profile.role) ? '/book' : `/${profile.role}/dashboard`}
                            className="btn btn-primary rounded-full px-6 py-2.5 shadow-lg shadow-blue-900/10"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-[#0077B6] transition-colors">Login</Link>
                            <Link href="/book-online" className="btn btn-primary rounded-full px-6 py-2.5 shadow-lg shadow-blue-900/10">
                                Book Appointment
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
