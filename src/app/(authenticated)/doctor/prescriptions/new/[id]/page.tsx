import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, Phone } from 'lucide-react'
import PrescriptionEditor from './PrescriptionEditor'

export const dynamic = 'force-dynamic'

export default async function NewPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id!
    const supabase = createAdminClient()

    if (!doctorId) return <div>Doctor profile invalid.</div>

    // Fetch doctor details, appointment, and templates in parallel
    const [{ data: doctor }, { data: appt }, { data: templates }] = await Promise.all([
        supabase.from('doctors').select('id, specialization, registration_number').eq('id', doctorId).single(),
        supabase.from('appointments').select(`
            id,
            start_time,
            patients (
                id, full_name, dob, gender, address, phone
            )
        `).eq('id', id).eq('clinic_id', clinicId).single(),
        supabase.from('prescription_templates').select('*').eq('doctor_id', doctorId).eq('clinic_id', clinicId).order('name', { ascending: true }),
    ])

    if (!doctor) return <div>Doctor profile invalid.</div>
    if (!appt) return <div>Appointment not found.</div>

    const patientData = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/doctor/appointments" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Write Prescription</h1>
                    <p className="text-slate-500 text-xs sm:text-sm truncate">
                        <span className="font-semibold text-slate-900">{patientData?.full_name || 'Unknown'}</span>
                        <span className="hidden sm:inline"> • {new Date(appt.start_time).toLocaleDateString()}</span>
                        {patientData?.phone && (
                            <>
                                {' • '}
                                <a
                                    href={`https://wa.me/${patientData.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    <Phone size={13} />
                                    <span className="hidden sm:inline">{patientData.phone}</span>
                                </a>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <PrescriptionEditor
                doctor={doctor}
                patient={patientData}
                appointmentId={appt.id}
                templates={templates || []}
            />
        </div>
    )
}
