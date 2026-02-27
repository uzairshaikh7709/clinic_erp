import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, Building2, Package, Pill, Receipt, FileText, IndianRupee } from 'lucide-react'
import { updateOrganization } from './actions'
import PharmacyToggle from './PharmacyToggle'
import BookingLinkCard from '@/components/BookingLinkCard'
import ClinicLinksCard from '@/components/ClinicLinksCard'
import OrgMembersClient from './OrgMembersClient'
import DeleteOrgButton from './DeleteOrgButton'

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const [{ data: org }, { data: members }, { data: unassignedUsers }, { data: orgDoctors }] = await Promise.all([
        admin.from('organizations').select('*').eq('id', id).single(),
        admin.from('profiles').select('*').eq('clinic_id', id).order('role'),
        admin.from('profiles').select('*').is('clinic_id', null).neq('role', 'superadmin').order('full_name'),
        admin.from('doctors').select('id, profile_id, profiles(full_name)').eq('clinic_id', id)
    ])

    // Pharmacy stats (only fetched if pharmacy_enabled)
    let pharmacyStats = null
    if (org?.pharmacy_enabled) {
        const [
            { count: totalMedicines },
            { count: totalInvoices },
            { data: paidInvoices },
            { count: pendingDispenses },
        ] = await Promise.all([
            admin.from('medicines').select('*', { count: 'exact', head: true }).eq('organization_id', id),
            admin.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', id),
            admin.from('invoices').select('grand_total').eq('organization_id', id).eq('payment_status', 'paid'),
            admin.from('prescriptions').select('*', { count: 'exact', head: true }).eq('clinic_id', id).eq('dispensing_status', 'pending'),
        ])
        const revenue = (paidInvoices || []).reduce((s: number, inv: any) => s + Number(inv.grand_total || 0), 0)
        pharmacyStats = {
            totalMedicines: totalMedicines ?? 0,
            totalInvoices: totalInvoices ?? 0,
            revenue,
            pendingDispenses: pendingDispenses ?? 0,
        }
    }

    if (!org) return <div className="p-8">Organization not found.</div>

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/superadmin/organizations" className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{org.name}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            org.org_type === 'pharmacy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                            {org.org_type || 'clinic'}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-mono">{org.slug}</p>
                </div>
            </div>

            {/* Org Details Card */}
            <div className="card">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-800">Details</h2>
                </div>
                <form action={updateOrganization} className="p-4 sm:p-5 space-y-4">
                    <input type="hidden" name="org_id" value={org.id} />
                    <div>
                        <label className="label">Name</label>
                        <input name="name" defaultValue={org.name} required className="input" />
                    </div>
                    <div>
                        <label className="label">Address</label>
                        <textarea name="address" defaultValue={org.address || ''} className="input" rows={2} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Phone</label>
                            <input name="phone" defaultValue={org.phone || ''} className="input" />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input name="email" defaultValue={org.email || ''} className="input" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="label">Active</label>
                        <select name="is_active" defaultValue={org.is_active ? 'true' : 'false'} className="select w-auto">
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-full sm:w-auto">Save Changes</button>
                </form>
            </div>

            {/* Modules (only for clinic orgs — pharmacy orgs always have pharmacy enabled) */}
            {org.org_type !== 'pharmacy' && (
                <div className="card">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                        <Package size={18} className="text-slate-400" />
                        <h2 className="font-bold text-slate-800">Modules</h2>
                    </div>
                    <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Pharmacy / Inventory</p>
                                <p className="text-xs text-slate-500">Enable in-house pharmacy and stock management</p>
                            </div>
                            <PharmacyToggle orgId={org.id} enabled={org.pharmacy_enabled ?? false} />
                        </div>
                    </div>
                </div>
            )}

            {/* Pharmacy Stats (visible when enabled) */}
            {pharmacyStats && (
                <div className="card">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                        <Pill size={18} className="text-indigo-400" />
                        <h2 className="font-bold text-slate-800">Pharmacy Stats</h2>
                    </div>
                    <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Medicines</p>
                            <p className="text-xl font-bold text-slate-800">{pharmacyStats.totalMedicines}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Invoices</p>
                            <p className="text-xl font-bold text-slate-800">{pharmacyStats.totalInvoices}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Revenue</p>
                            <p className="text-xl font-bold text-emerald-600">₹{pharmacyStats.revenue.toFixed(0)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Pending Rx</p>
                            <p className="text-xl font-bold text-slate-800">{pharmacyStats.pendingDispenses}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Link (clinic orgs only) */}
            {org.org_type !== 'pharmacy' && org.slug && <BookingLinkCard slug={org.slug} orgName={org.name} />}

            {/* Portal Links (both clinic and pharmacy orgs) */}
            {org.slug && <ClinicLinksCard slug={org.slug} orgType={org.org_type} />}

            {/* Members */}
            <OrgMembersClient
                members={members || []}
                orgId={org.id}
                unassignedUsers={unassignedUsers || []}
                orgDoctors={(orgDoctors || []) as any}
            />

            {/* Danger Zone */}
            <div className="card border-red-200">
                <div className="p-4 sm:p-5 border-b border-red-100 bg-red-50/50">
                    <h2 className="font-bold text-red-700 text-sm">Danger Zone</h2>
                </div>
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">Delete this organization</p>
                        <p className="text-xs text-slate-500">Permanently remove this organization. All members must be removed first.</p>
                    </div>
                    <DeleteOrgButton orgId={org.id} orgName={org.name} />
                </div>
            </div>
        </div>
    )
}
