import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { Clock } from 'lucide-react'
import AvailabilityForm from './AvailabilityForm'

export default async function AvailabilityPage() {
    const profile = await requireRole(['doctor'])
    const admin = createAdminClient()

    const { data: doctor } = await admin
        .from('doctors')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

    if (!doctor) return <div>Doctor profile not found.</div>

    // Fetch existing slots
    const { data: slots } = await admin
        .from('doctor_slots')
        .select('*')
        .eq('doctor_id', doctor.id)
        .eq('is_active', true)

    // Extract existing settings
    const existingDays = slots ? [...new Set(slots.map(s => s.day_of_week))] : []
    const existingSlot = slots?.[0] || null

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Availability Settings</h1>
                    <p className="text-slate-500">Define your working hours for patient bookings</p>
                </div>
            </div>

            <AvailabilityForm
                existingDays={existingDays}
                existingStartTime={existingSlot?.start_time || '09:00'}
                existingEndTime={existingSlot?.end_time || '17:00'}
                existingDuration={existingSlot?.slot_duration || 15}
            />

            <div className="p-4 bg-blue-50 text-[#0077B6] rounded-lg text-sm border border-blue-100 flex items-start gap-3">
                <div className="mt-0.5">ℹ️</div>
                <p>
                    Changes to availability will affect new bookings only. Existing appointments remain unchanged.
                </p>
            </div>
        </div>
    )
}
