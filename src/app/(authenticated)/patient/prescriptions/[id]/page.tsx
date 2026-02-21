import { getUserProfile } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import PrintButton from '../../../doctor/prescriptions/[id]/PrintButton'

export default async function PatientPrescriptionViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await getUserProfile()
    if (!profile) redirect('/login')

    const clinicId = profile.clinic_id
    const supabase = createAdminClient()

    // Fetch patient record (by profile_id, with name fallback) and org info in parallel
    const [{ data: patientByProfile }, { data: org }] = await Promise.all([
        supabase
            .from('patients')
            .select('id')
            .eq('profile_id', profile.id)
            .eq('clinic_id', clinicId)
            .single(),
        supabase
            .from('organizations')
            .select('name, address, phone, email')
            .eq('id', clinicId)
            .single()
    ])

    // Fallback to full_name for legacy records without profile_id
    let patient = patientByProfile
    if (!patient) {
        const { data: legacyPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('full_name', profile.full_name)
            .eq('clinic_id', clinicId)
            .limit(1)
            .single()
        patient = legacyPatient
    }

    if (!patient) return <div className="p-12 text-center text-slate-500">Patient record not found.</div>

    // Fetch prescription ensuring it belongs to this patient
    const { data: rx } = await supabase
        .from('prescriptions')
        .select(`
            *,
            doctors (
                specialization, registration_number,
                profiles (full_name)
            ),
            patients (
                full_name, dob, gender, address, registration_number
            )
        `)
        .eq('id', id)
        .eq('patient_id', patient.id)
        .eq('clinic_id', clinicId)
        .single()

    if (!rx) return <div className="p-12 text-center text-slate-500">Prescription not found.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="print:hidden flex items-center justify-between">
                <Link href="/patient/prescriptions" className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to My Prescriptions
                </Link>
                <div className="flex gap-3">
                    <PrintButton />
                </div>
            </div>

            <div className="bg-white shadow-xl shadow-slate-200 print:shadow-none print:w-full print:border-none border border-slate-100 sm:min-h-[1100px] p-5 sm:p-12 print:p-0 relative mx-auto w-full sm:max-w-[210mm]">
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-800 pb-6 mb-8 gap-4">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">{org?.name || 'DrEase'}</h1>
                        <p className="text-slate-500 text-sm mt-1">Center for Advanced Healthcare</p>
                        <p className="text-slate-400 text-xs mt-4">
                            {org?.address || ''}<br />
                            {org?.phone ? `Phone: ${org.phone}` : ''}{org?.email ? ` • Email: ${org.email}` : ''}
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">{rx.doctors.profiles?.full_name}</h2>
                        <p className="text-slate-600 font-medium">{rx.doctors.specialization}</p>
                        <p className="text-slate-400 text-sm">Reg No: {rx.doctors.registration_number}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg print:border print:border-slate-200 print:bg-transparent mb-8 flex flex-col sm:flex-row justify-between items-start text-sm gap-3">
                    <div className="space-y-1">
                        <p><span className="font-semibold text-slate-600 w-20 inline-block">Patient:</span> <span className="font-bold text-slate-900 text-lg">{rx.patients.full_name}</span></p>
                        <p><span className="font-semibold text-slate-600 w-20 inline-block">Age/Sex:</span>
                            {(() => {
                                if (!rx.patients.dob) return 'N/A'
                                const age = new Date().getFullYear() - new Date(rx.patients.dob).getFullYear()
                                return `${age}Y / ${rx.patients.gender || ''}`
                            })()}
                        </p>
                        <p><span className="font-semibold text-slate-600 w-20 inline-block">ID:</span> {rx.patients.registration_number}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p><span className="font-semibold text-slate-600">Date:</span> {new Date(rx.created_at).toLocaleDateString()}</p>
                        <p><span className="font-semibold text-slate-600">Rx ID:</span> {rx.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8">
                    <div className="sm:col-span-4 sm:border-r border-slate-200 sm:pr-6 space-y-6">
                        {rx.history && (
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">History</h4>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{rx.history}</p>
                            </div>
                        )}
                        {rx.examinations && (
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Examination</h4>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{rx.examinations}</p>
                            </div>
                        )}
                        {rx.investigations && (
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Investigations</h4>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{rx.investigations}</p>
                            </div>
                        )}
                        {rx.diagnosis && (
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Diagnosis</h4>
                                <p className="text-sm font-semibold text-slate-900">{rx.diagnosis}</p>
                            </div>
                        )}
                    </div>

                    <div className="sm:col-span-8 space-y-8 sm:pl-2">
                        <div>
                            <h3 className="font-serif italic text-4xl text-slate-300 font-bold mb-4">Rx</h3>
                            <div className="space-y-4">
                                {(rx.medications as any[] || []).map((med: any, i: number) => (
                                    <div key={i} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0">
                                        <div>
                                            <p className="font-bold text-slate-900 text-base">{med.name} <span className="text-slate-400 font-normal text-sm ml-2">-- {med.dosage}</span></p>
                                            <p className="text-sm text-slate-500 mt-0.5">{med.instruction}</p>
                                        </div>
                                        <div className="text-right text-sm font-mono text-slate-600">
                                            <p>{med.frequency}</p>
                                            <p className="text-xs text-slate-400">{med.duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {rx.advice && (
                            <div className="bg-amber-50 rounded-lg p-4 print:bg-transparent print:p-0 print:border print:border-slate-200 print:mt-8">
                                <h4 className="font-bold text-sm text-slate-700 mb-1">Advice</h4>
                                <p className="text-sm text-slate-800">{rx.advice}</p>
                            </div>
                        )}

                        {rx.follow_up_date && (
                            <div className="pt-4">
                                <p className="font-bold text-slate-800 text-sm">
                                    Next Follow-up: <span className="text-[#0077B6]">{new Date(rx.follow_up_date).toLocaleDateString()}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sm:absolute sm:bottom-12 sm:left-12 sm:right-12 mt-12 sm:mt-0 flex justify-end sm:justify-between items-end">
                    <div className="text-center"></div>
                    <div className="text-center space-y-8">
                        <div className="w-48 h-16 border-b border-slate-300 flex items-end justify-center pb-2">
                            <p className="font-cursive text-xl text-slate-800 rotate-[-5deg] opacity-80" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                                {rx.doctors.profiles?.full_name}
                            </p>
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{rx.doctors.profiles?.full_name}</p>
                        <p className="text-[10px] text-slate-400">Digitally Signed</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
