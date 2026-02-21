import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { updateOrganization } from './actions'
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

    if (!org) return <div className="p-8">Organization not found.</div>

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/superadmin/organizations" className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{org.name}</h1>
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

            {/* Booking Link */}
            {org.slug && <BookingLinkCard slug={org.slug} orgName={org.name} />}

            {/* Clinic Portal Links */}
            {org.slug && <ClinicLinksCard slug={org.slug} />}

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
