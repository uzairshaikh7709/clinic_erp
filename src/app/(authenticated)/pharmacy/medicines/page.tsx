import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getMedicinesPaginated } from '../actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import { StockBadge } from '@/components/pharmacy/StockBadge'
import Link from 'next/link'
import { Plus, Search, Package } from 'lucide-react'
import MedicineSearch from './MedicineSearch'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other']

export default async function MedicinesPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; category?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const search = params.search || ''
    const category = params.category || ''

    const { medicines, totalCount } = await getMedicinesPaginated(clinicId, page, search || undefined, category || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Medicines</h1>
                    <p className="text-slate-500 text-sm">{totalCount} medicines in inventory</p>
                </div>
                <Link href="/pharmacy/medicines/new" className="btn btn-primary text-sm">
                    <Plus size={16} className="mr-1.5" /> Add Medicine
                </Link>
            </div>

            {/* Search & Filter */}
            <div className="card p-4">
                <MedicineSearch defaultSearch={search} defaultCategory={category} categories={CATEGORIES} />
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {medicines.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Package size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No medicines found</p>
                        <p className="text-sm mt-1">
                            {search || category ? 'Try adjusting your filters' : 'Add your first medicine to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Generic</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {medicines.map((m: any) => (
                                        <tr key={m.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/medicines/${m.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                    {m.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{m.generic_name || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{m.category || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                {m.total_stock} <span className="text-xs font-normal text-slate-400">{m.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StockBadge stock={m.total_stock} threshold={m.low_stock_threshold} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/pharmacy/medicines/${m.id}`} className="text-indigo-600 hover:underline text-sm font-medium">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {medicines.map((m: any) => (
                                <Link key={m.id} href={`/pharmacy/medicines/${m.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{m.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{m.generic_name || m.category || m.unit}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-slate-800">{m.total_stock} <span className="text-xs font-normal text-slate-400">{m.unit}</span></p>
                                            <div className="mt-1">
                                                <StockBadge stock={m.total_stock} threshold={m.low_stock_threshold} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/medicines"
                            searchParams={{ ...(search ? { search } : {}), ...(category ? { category } : {}) }}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
