import { createAdminClient } from '@/utils/supabase/admin'

export default async function StatusDebugPage() {
    const supabase = createAdminClient()
    const { data: appointments } = await supabase.from('appointments').select('*')
    // Get unique statuses
    const statuses = Array.from(new Set(appointments?.map((a: any) => a.status)))

    return (
        <div className="p-8">
            <h1 className="text-xl font-bold">Debug Statuses</h1>
            <pre>{JSON.stringify(statuses, null, 2)}</pre>
            <pre>{JSON.stringify(appointments, null, 2)}</pre>
        </div>
    )
}
