import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PrescriptionEditor from '../../new/[id]/PrescriptionEditor'

export const dynamic = 'force-dynamic'

export default async function EditPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id!
    const supabase = createAdminClient()

    if (!doctorId) return <div>Doctor profile invalid.</div>

    // Fetch doctor details, prescription, and templates in parallel
    const [{ data: doctor }, { data: rx }, { data: templates }] = await Promise.all([
        supabase.from('doctors').select('id, specialization, registration_number').eq('id', doctorId).single(),
        supabase.from('prescriptions').select(`
            *,
            patients (
                id, full_name, dob, gender, address
            ),
            appointments (
                id, start_time
            )
        `).eq('id', id).eq('clinic_id', clinicId).single(),
        supabase.from('prescription_templates').select('*').eq('doctor_id', doctorId).eq('clinic_id', clinicId).order('name', { ascending: true }),
    ])

    if (!doctor) return <div>Doctor profile invalid.</div>
    if (!rx) return <div>Prescription not found.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-enter">
            <div className="flex items-center gap-4">
                <Link href={`/doctor/patients/${rx.patient_id}`} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Edit Prescription</h1>
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
                templates={templates || []}
            />
        </div>
    )
}
