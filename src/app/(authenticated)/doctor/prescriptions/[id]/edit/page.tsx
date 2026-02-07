import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PrescriptionEditor from '../../new/[id]/PrescriptionEditor'

export default async function EditPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await requireRole(['doctor'])
    const supabase = createAdminClient()

    // 1. Get Doctor ID
    const { data: doctor } = await supabase
        .from('doctors')
        .select('id, specialization, registration_number')
        .eq('profile_id', profile.id)
        .single()

    if (!doctor) return <div>Doctor profile invalid.</div>

    // 2. Get Prescription with Patient & Appointment Data
    const { data: rx } = await supabase
        .from('prescriptions')
        .select(`
            *,
            patients (
                id, full_name, dob, gender, address
            ),
            appointments (
                id, start_time
            )
        `)
        .eq('id', id)
        .single()

    if (!rx) return <div>Prescription not found.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/doctor/prescriptions" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Edit Prescription</h1>
                    <p className="text-slate-500 text-sm">
                        Patient: <span className="font-semibold text-slate-900">{rx.patients?.full_name || 'Unknown'}</span>
                    </p>
                </div>
            </div>

            <PrescriptionEditor
                doctor={doctor}
                patient={rx.patients}
                appointmentId={rx.appointment_id}
                initialData={rx}
            />
        </div>
    )
}
