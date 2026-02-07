import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PrescriptionEditor from './PrescriptionEditor'

export default async function NewPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
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

    // 2. Get Appointment & Patient
    const { data: appt } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            patients (
                id, full_name, dob, gender, address
            )
        `)
        .eq('id', id)
        .single()

    if (!appt) return <div>Appointment not found.</div>

    // Fix type inference: patients is an object (single)
    const patientData = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/doctor/appointments" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Write Prescription</h1>
                    <p className="text-slate-500 text-sm">
                        Patient: <span className="font-semibold text-slate-900">{patientData?.full_name || 'Unknown'}</span> •
                        {new Date(appt.start_time).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <PrescriptionEditor
                doctor={doctor}
                patient={patientData}
                appointmentId={appt.id}
            />
        </div>
    )
}
