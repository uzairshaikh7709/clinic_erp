import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getPendingPrescriptions } from '../actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import Link from 'next/link'
import { FileText, CheckCircle, PenLine } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DispensePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')

    const { prescriptions, totalCount } = await getPendingPrescriptions(clinicId, page)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dispense Prescriptions</h1>
                    <p className="text-slate-500 text-sm">{totalCount} pending prescription{totalCount !== 1 ? 's' : ''}</p>
                </div>
                <Link
                    href="/pharmacy/dispense/manual"
                    className="btn btn-primary inline-flex items-center gap-2 w-fit"
                >
                    <PenLine size={16} /> Manual Dispense
                </Link>
            </div>

            <div className="card overflow-hidden">
                {prescriptions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
                        <p className="font-medium text-slate-800">All caught up!</p>
                        <p className="text-sm text-slate-500 mt-1">No prescriptions pending dispensing.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Patient</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Doctor</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Medicines</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {prescriptions.map((rx: any) => (
                                        <tr key={rx.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {(rx.patients as any)?.full_name || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {(rx.doctors as any)?.profiles?.full_name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                                                    <FileText size={12} /> {(rx.medications || []).length} items
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                {new Date(rx.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/pharmacy/dispense/${rx.id}`}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                                                >
                                                    Dispense
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {prescriptions.map((rx: any) => (
                                <Link key={rx.id} href={`/pharmacy/dispense/${rx.id}`} className="block p-4 hover:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">
                                                {(rx.patients as any)?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Dr. {(rx.doctors as any)?.profiles?.full_name || '—'} &middot;{' '}
                                                {(rx.medications || []).length} medicines
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(rx.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                                })}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-indigo-600 flex-shrink-0">Dispense</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/dispense"
                            searchParams={{}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
