import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getSuppliersPaginated } from '../purchase-actions'
import { PaginationControls } from '@/components/pharmacy/PaginationControls'
import Link from 'next/link'
import { Plus, Truck, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
    const { clinicId } = await requirePharmacyEnabled()
    const params = await searchParams
    const page = parseInt(params.page || '1')
    const search = params.search || ''

    const { suppliers, totalCount } = await getSuppliersPaginated(clinicId, page, search || undefined)

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Suppliers</h1>
                    <p className="text-slate-500 text-sm">{totalCount} suppliers registered</p>
                </div>
                <Link href="/pharmacy/suppliers/new" className="btn btn-primary text-sm">
                    <Plus size={16} className="mr-1.5" /> Add Supplier
                </Link>
            </div>

            {/* Search */}
            <div className="card p-4">
                <form className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Search suppliers by name, contact, or GSTIN..."
                            className="input pl-9 w-full"
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary text-sm">Search</button>
                </form>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {suppliers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Truck size={40} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No suppliers found</p>
                        <p className="text-sm mt-1">
                            {search ? 'Try adjusting your search' : 'Add your first supplier to get started'}
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
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Contact</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">GSTIN</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">DL No.</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">City</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {suppliers.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/pharmacy/suppliers/${s.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                                                    {s.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {s.contact_person || '—'}
                                                {s.phone && <span className="block text-xs text-slate-400">{s.phone}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{s.gstin || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{s.drug_license_no || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{s.city || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {s.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/pharmacy/suppliers/${s.id}`} className="text-indigo-600 hover:underline text-sm font-medium">
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
                            {suppliers.map((s: any) => (
                                <Link key={s.id} href={`/pharmacy/suppliers/${s.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{s.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {s.contact_person || s.phone || s.city || '—'}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                                            s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={20}
                            basePath="/pharmacy/suppliers"
                            searchParams={search ? { search } : {}}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
