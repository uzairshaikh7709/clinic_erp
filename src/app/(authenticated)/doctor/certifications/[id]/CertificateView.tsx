'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit, Printer, Minus, Plus } from 'lucide-react'

const STORAGE_KEY = 'cert-header-margin'
const DEFAULT_MARGIN = 120

interface Props {
    cert: {
        id: string
        patient_name: string
        age: string
        sex: string
        address: string | null
        certificate_type: string
        description: string | null
        date: string
        created_at: string
    }
    doctorName: string
    specialization: string
    registrationNumber: string
}

export default function CertificateView({ cert, doctorName, specialization, registrationNumber }: Props) {
    const [margin, setMargin] = useState(DEFAULT_MARGIN)

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setMargin(Number(saved))
    }, [])

    const updateMargin = (val: number) => {
        const clamped = Math.max(0, Math.min(400, val))
        setMargin(clamped)
        localStorage.setItem(STORAGE_KEY, String(clamped))
    }

    const formattedDate = new Date(cert.date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const defaultBody = `This is to certify that ${cert.patient_name}, aged ${cert.age} years, ${cert.sex}, has been examined by me on ${formattedDate}.`

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
            {/* Controls Bar - hidden on print */}
            <div className="print:hidden flex items-center justify-between gap-4">
                <Link href="/doctor/certifications" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm">
                    <ArrowLeft size={16} /> Back to Certifications
                </Link>
                <Link href={`/doctor/certifications/${cert.id}/edit`} className="btn btn-sm btn-secondary">
                    <Edit size={14} className="mr-1" /> Edit
                </Link>
            </div>

            {/* Print Controls - hidden on print */}
            <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600">Header Margin:</span>
                    <button onClick={() => updateMargin(margin - 10)} className="btn btn-sm btn-ghost p-1"><Minus size={16} /></button>
                    <input
                        type="number"
                        value={margin}
                        onChange={e => updateMargin(Number(e.target.value))}
                        className="input w-20 h-8 text-center text-sm"
                    />
                    <span className="text-xs text-slate-400">px</span>
                    <button onClick={() => updateMargin(margin + 10)} className="btn btn-sm btn-ghost p-1"><Plus size={16} /></button>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn btn-primary shadow-lg shadow-blue-500/20"
                >
                    <Printer size={18} className="mr-2" /> Print Certificate
                </button>
            </div>

            {/* Printable Certificate */}
            <div className="rx-printable bg-white shadow-xl shadow-slate-200 print:shadow-none print:border-none border border-slate-100 mx-auto w-full sm:max-w-[210mm]">
                {/* Adjustable Header Margin (blank space for letterhead) */}
                <div className="rx-header-space" style={{ height: `${margin}px` }} />

                {/* Doctor Info - Right aligned */}
                <div className="px-6 sm:px-10 pt-4">
                    <div className="flex justify-end">
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-slate-900">Dr. {doctorName}</h2>
                            <p className="text-sm text-slate-600">{specialization}</p>
                            {registrationNumber && (
                                <p className="text-xs text-slate-500">Reg No: {registrationNumber}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-6 sm:mx-10 border-b border-slate-300 my-3" />

                {/* Title */}
                <div className="px-6 sm:px-10 text-center my-4">
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider underline underline-offset-4 decoration-2">
                        {cert.certificate_type}
                    </h3>
                </div>

                {/* Date */}
                <div className="px-6 sm:px-10 text-right mb-4">
                    <p className="text-sm text-slate-700">
                        <span className="font-semibold">Date:</span> {formattedDate}
                    </p>
                </div>

                {/* Patient Details */}
                <div className="px-6 sm:px-10">
                    <div className="border border-slate-300 rounded text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                            <div className="p-3 space-y-1.5 sm:border-r border-slate-300">
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Patient Name:</span>
                                    <span className="font-bold text-slate-900">{cert.patient_name}</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Age / Sex:</span>
                                    <span>{cert.age} years / {cert.sex}</span>
                                </p>
                            </div>
                            <div className="p-3 space-y-1.5 border-t sm:border-t-0 border-slate-300">
                                {cert.address && (
                                    <p>
                                        <span className="font-semibold text-slate-600 inline-block w-24">Address:</span>
                                        <span>{cert.address}</span>
                                    </p>
                                )}
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-24">Cert ID:</span>
                                    <span>{cert.id.slice(0, 8).toUpperCase()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 sm:px-10 mt-6 min-h-[200px] text-base leading-relaxed text-slate-800">
                    <p className="mb-4">To Whom It May Concern,</p>
                    <p className="whitespace-pre-wrap">{cert.description || defaultBody}</p>
                </div>

                {/* Signature */}
                <div className="px-6 sm:px-10 mt-12 mb-8 flex justify-between items-end">
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1" />
                        <p className="text-sm text-slate-600">Patient Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1" />
                        <p className="font-bold text-slate-800 text-sm">Dr. {doctorName}</p>
                        <p className="text-xs text-slate-500">{specialization}</p>
                        {registrationNumber && (
                            <p className="text-xs text-slate-500">Reg: {registrationNumber}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
