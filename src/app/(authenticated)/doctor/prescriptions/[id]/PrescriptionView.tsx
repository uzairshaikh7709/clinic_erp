'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit, Settings } from 'lucide-react'
import PrintControls from './PrintButton'

const PRINT_SETTINGS_KEY = 'rx-print-settings'

type PrintSettings = {
    showSymptoms: boolean
    showExamination: boolean
    showDiagnosis: boolean
    showInvestigations: boolean
    showAdvice: boolean
}

const DEFAULT_SETTINGS: PrintSettings = {
    showSymptoms: true,
    showExamination: true,
    showDiagnosis: false,
    showInvestigations: false,
    showAdvice: false,
}

export default function PrescriptionView({ rx, org }: { rx: any; org: any }) {
    const [headerMargin, setHeaderMargin] = useState(120)
    const onMarginChange = useCallback((px: number) => setHeaderMargin(px), [])
    const [showSettings, setShowSettings] = useState(false)
    const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS)

    useEffect(() => {
        const saved = localStorage.getItem(PRINT_SETTINGS_KEY)
        if (saved) {
            try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }) } catch { }
        }
    }, [])

    const updateSetting = (key: keyof PrintSettings, value: boolean) => {
        const next = { ...settings, [key]: value }
        setSettings(next)
        localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(next))
    }

    const meds: any[] = rx.medications || []
    const doctorName = rx.doctors?.profiles?.full_name || ''
    const specialization = rx.doctors?.specialization || ''
    const regNo = rx.doctors?.registration_number || ''

    const calcAge = () => {
        if (!rx.patients?.dob) return 'N/A'
        const dob = new Date(rx.patients.dob)
        const now = new Date()
        let years = now.getFullYear() - dob.getFullYear()
        let months = now.getMonth() - dob.getMonth()
        if (months < 0) { years--; months += 12 }
        if (years > 0) return `${years}Y${months > 0 ? ` ${months}M` : ''}`
        return `${months}M`
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
            {/* Controls Bar - hidden on print */}
            <div className="print:hidden flex items-center justify-between gap-4">
                <Link href={`/doctor/patients/${rx.patient_id}`} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm">
                    <ArrowLeft size={16} /> Back to Patient
                </Link>
                <Link href={`/doctor/prescriptions/${rx.id}/edit`} className="btn btn-sm btn-secondary">
                    <Edit size={14} className="mr-1" /> Edit
                </Link>
            </div>

            <PrintControls onMarginChange={onMarginChange} />

            {/* Print Settings - hidden on print */}
            <div className="print:hidden">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                    <Settings size={15} /> Print Settings
                </button>
                {showSettings && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-x-6 gap-y-2">
                        {([
                            ['showSymptoms', 'Symptoms / History'],
                            ['showExamination', 'Examination'],
                            ['showDiagnosis', 'Diagnosis'],
                            ['showInvestigations', 'Investigations'],
                            ['showAdvice', 'Advice'],
                        ] as [keyof PrintSettings, string][]).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={settings[key]}
                                    onChange={e => updateSetting(key, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-500"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Printable Prescription */}
            <div className="rx-printable bg-white shadow-xl shadow-slate-200 print:shadow-none print:border-none border border-slate-100 mx-auto w-full sm:max-w-[210mm]">

                {/* Adjustable Header Margin (blank space for letterhead) */}
                <div className="rx-header-space" style={{ height: `${headerMargin}px` }} />

                {/* Doctor Info - Right aligned */}
                <div className="px-6 sm:px-10 pt-4">
                    <div className="flex justify-end">
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-slate-900">{doctorName}</h2>
                            <p className="text-sm text-slate-600">{specialization}</p>
                            <p className="text-xs text-slate-500">Reg No: {regNo}</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-6 sm:mx-10 border-b border-slate-300 my-3" />

                {/* Patient Details */}
                <div className="px-6 sm:px-10">
                    <div className="border border-slate-300 rounded text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                            <div className="p-3 space-y-1.5 sm:border-r border-slate-300">
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Patient Name:</span>
                                    <span className="font-bold text-slate-900">{rx.patients?.full_name}</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Age / Sex:</span>
                                    <span>{calcAge()} / {rx.patients?.gender || ''}</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Regd No:</span>
                                    <span>{rx.patients?.registration_number || ''}</span>
                                </p>
                                {rx.patients?.address && (
                                    <p>
                                        <span className="font-semibold text-slate-600 inline-block w-24">Address:</span>
                                        <span>{rx.patients.address}</span>
                                    </p>
                                )}
                            </div>
                            <div className="p-3 space-y-1.5 border-t sm:border-t-0 border-slate-300">
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Date & Time:</span>
                                    <span>{new Date(rx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(rx.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Rx ID:</span>
                                    <span>{rx.id.slice(0, 8).toUpperCase()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clinical Notes - controlled by print settings */}
                {(settings.showSymptoms || settings.showExamination || settings.showDiagnosis || settings.showInvestigations) && (
                    <div className="px-6 sm:px-10 mt-5 space-y-2 text-sm">
                        {settings.showSymptoms && rx.history && (
                            <p><span className="font-bold text-slate-700">Symptoms:</span> <span className="text-slate-800">{rx.history}</span></p>
                        )}
                        {settings.showExamination && rx.examinations && (
                            <p><span className="font-bold text-slate-700">Examination:</span> <span className="text-slate-800">{rx.examinations}</span></p>
                        )}
                        {settings.showDiagnosis && rx.diagnosis && (
                            <p><span className="font-bold text-slate-700">Diagnosis:</span> <span className="font-semibold text-slate-900">{rx.diagnosis}</span></p>
                        )}
                        {settings.showInvestigations && rx.investigations && (
                            <p><span className="font-bold text-slate-700">Investigations:</span> <span className="text-slate-800">{rx.investigations}</span></p>
                        )}
                    </div>
                )}

                {/* Rx Table */}
                <div className="px-6 sm:px-10 mt-5">
                    <h3 className="font-bold text-slate-700 mb-2 text-base">Rx</h3>
                    <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                    <table className="rx-table w-full border-collapse text-sm min-w-[500px]">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700 w-8">#</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700">Medicine</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700 w-20">Dosage</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700 w-20">Duration</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700 w-12">Qty</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700">Instructions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meds.map((med, i) => (
                                <tr key={i}>
                                    <td className="border border-slate-300 px-2 py-2 text-slate-600">{i + 1})</td>
                                    <td className="border border-slate-300 px-2 py-2 font-medium text-slate-900">{med.name}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-slate-700 font-mono">{med.frequency || '--'}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-slate-700">{med.duration || '--'}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-slate-700 text-center">{med.qty || '--'}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-slate-600">{med.instruction || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Advice - controlled by print settings */}
                {settings.showAdvice && rx.advice && (
                    <div className="px-6 sm:px-10 mt-4 text-sm">
                        <p><span className="font-bold text-slate-700">Advice:</span> {rx.advice}</p>
                    </div>
                )}

                {/* Follow-up */}
                {rx.follow_up_date && (
                    <div className="px-6 sm:px-10 mt-4 text-sm">
                        <p className="font-bold text-slate-800">
                            Follow Up: On {new Date(rx.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            ({new Date(rx.follow_up_date).toLocaleDateString('en-US', { weekday: 'long' })})
                        </p>
                    </div>
                )}

                {/* Signature */}
                <div className="px-6 sm:px-10 mt-12 mb-8 flex justify-end">
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1" />
                        <p className="font-bold text-slate-800 text-sm">{doctorName}</p>
                        <p className="text-xs text-slate-500">Reg No: {regNo}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
