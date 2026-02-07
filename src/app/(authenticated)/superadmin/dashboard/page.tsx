import { requireRole } from '@/utils/auth'
import Link from 'next/link'
import { Users, UserPlus } from 'lucide-react'

export default async function SuperAdminDashboard() {
    await requireRole(['superadmin'])

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-900 border-b pb-4">Superadmin Console</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <Link href="/superadmin/users/create" className="card hover:shadow-lg transition-shadow bg-blue-50 border-blue-200 cursor-pointer p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 text-white p-4 rounded-full">
                            <UserPlus size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-900">Create New User</h3>
                            <p className="text-slate-600">Register new Doctors or Assistants</p>
                        </div>
                    </div>
                </Link>

                <Link href="/superadmin/users" className="card hover:shadow-lg transition-shadow cursor-pointer p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 text-white p-4 rounded-full">
                            <Users size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Manage Accounts</h3>
                            <p className="text-slate-600">View, disable, or edit system users</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
