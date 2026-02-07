import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import PrintButton from './PrintButton'

export default async function ViewPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await requireRole(['doctor'])
    const supabase = createAdminClient()

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
        .single()

    if (!rx) return <div>Prescription not found.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* Header / Actions - Hidden on Print */}
            <div className="print:hidden flex items-center justify-between">
                <Link href="/doctor/prescriptions" className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to List
                </Link>
                <div className="flex gap-3">
                    <PrintButton />
                </div>
            </div>

            {/* A4 Paper View */}
            <div className="bg-white shadow-xl shadow-slate-200 print:shadow-none print:w-full print:border-none border border-slate-100 min-h-[1100px] p-12 print:p-0 relative mx-auto w-full max-w-[210mm]">

                {/* Clinic Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">OrthoClinic</h1>
                        <p className="text-slate-500 text-sm mt-1">Center for Advanced Orthopedics</p>
                        <p className="text-slate-400 text-xs mt-4">
                            123 Medical Plaza, Health City<br />
                            Phone: +1 (555) 123-4567 • Email: support@orthoclinic.com
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">{rx.doctors.profiles?.full_name}</h2>
                        <p className="text-slate-600 font-medium">{rx.doctors.specialization}</p>
                        <p className="text-slate-400 text-sm">Reg No: {rx.doctors.registration_number}</p>
                    </div>
                </div>

                {/* Patient Details */}
                <div className="bg-slate-50 p-4 rounded-lg print:border print:border-slate-200 print:bg-transparent mb-8 flex justify-between items-start text-sm">
                    <div className="space-y-1">
                        <p><span className="font-semibold text-slate-600 w-20 inline-block">Patient:</span> <span className="font-bold text-slate-900 text-lg">{rx.patients.full_name}</span></p>
                        <p><span className="font-semibold text-slate-600 w-20 inline-block">Age/Sex:</span>
                            {/* Calc Age */}
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

                {/* Body */}
                <div className="grid grid-cols-12 gap-8">

                    {/* Sidebar / Findings */}
                    <div className="col-span-4 border-r border-slate-200 pr-6 space-y-6">
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

                    {/* Rx */}
                    <div className="col-span-8 space-y-8 pl-2">
                        <div>
                            <h3 className="font-serif italic text-4xl text-slate-300 font-bold mb-4">Rx</h3>

                            <div className="space-y-4">
                                {(rx.medications as any[] || []).map((med, i) => (
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

                {/* Footer */}
                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                    <div className="text-center">
                        {/* QR Code Placeholder? */}
                    </div>
                    <div className="text-center space-y-8">
                        {/* Signature Line */}
                        <div className="w-48 h-16 border-b border-slate-300 flex items-end justify-center pb-2">
                            {/* Signature Font */}
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
