import { requireClinicOwner } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import ClinicPageEditor from './ClinicPageEditor'
import { Globe } from 'lucide-react'

export default async function ClinicPageEditorPage() {
    const owner = await requireClinicOwner()
    const admin = createAdminClient()

    const { data: org } = await admin
        .from('organizations')
        .select('slug, page_data')
        .eq('id', owner.clinic_id)
        .single()

    return (
        <div className="space-y-6 animate-enter">
            <div>
                <div className="flex items-center gap-2">
                    <Globe size={20} className="text-slate-400" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Clinic Page</h1>
                </div>
                <p className="text-slate-500 text-sm mt-1">Customize your public clinic landing page</p>
            </div>

            <ClinicPageEditor
                slug={org?.slug || ''}
                initialData={org?.page_data || {}}
            />
        </div>
    )
}
