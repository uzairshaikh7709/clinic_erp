import { requireDoctorWithClinic } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import ClinicPageEditor from './ClinicPageEditor'
import BookingLinkCard from '@/components/BookingLinkCard'
import ClinicLinksCard from '@/components/ClinicLinksCard'
import { Globe, Building2 } from 'lucide-react'
import { updateOrgDetails } from './actions'

export default async function ClinicPageEditorPage() {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const [{ data: org }, { count: doctorCount }] = await Promise.all([
        admin
            .from('organizations')
            .select('id, name, slug, address, phone, email, logo_url, page_data')
            .eq('id', doctor.clinic_id)
            .single(),
        admin
            .from('doctors')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', doctor.clinic_id)
            .eq('is_active', true),
    ])

    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div>
                <div className="flex items-center gap-2">
                    <Globe size={20} className="text-slate-400" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Clinic Settings</h1>
                </div>
                <p className="text-slate-500 text-sm mt-1">Manage your clinic details and public page</p>
            </div>

            {/* Organization Details */}
            <div className="card">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-800">Clinic Details</h2>
                </div>
                <form action={updateOrgDetails} className="p-4 sm:p-5 space-y-4">
                    <input type="hidden" name="org_id" value={org?.id || ''} />
                    <div>
                        <label className="label">Name</label>
                        <input name="name" defaultValue={org?.name || ''} required className="input" />
                    </div>
                    <div>
                        <label className="label">Address</label>
                        <textarea name="address" defaultValue={org?.address || ''} className="input" rows={2} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Phone</label>
                            <input name="phone" defaultValue={org?.phone || ''} className="input" />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input name="email" defaultValue={org?.email || ''} className="input" />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full sm:w-auto">Save Details</button>
                </form>
            </div>

            {/* Booking Link */}
            {org?.slug && <BookingLinkCard slug={org.slug} orgName={org.name} />}

            {/* Clinic Portal Links */}
            {org?.slug && <ClinicLinksCard slug={org.slug} />}

            {/* Clinic Page Editor */}
            <ClinicPageEditor
                slug={org?.slug || ''}
                initialData={org?.page_data || {}}
                orgName={org?.name || ''}
                orgAddress={org?.address || ''}
                orgPhone={org?.phone || ''}
                orgEmail={org?.email || ''}
                logoUrl={org?.logo_url || ''}
                doctorCount={doctorCount || 0}
            />
        </div>
    )
}
