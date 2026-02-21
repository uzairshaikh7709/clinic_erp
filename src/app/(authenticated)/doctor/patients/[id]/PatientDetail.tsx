'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, FileText, Phone, MapPin, Calendar, User,
    Pill, Clock, Loader2, Edit, ChevronRight, Trash2
} from 'lucide-react'
import { createWalkInAppointment, deletePatient } from '../actions'
import { useRouter } from 'next/navigation'

function WalkInButton({ patientId }: { patientId: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleClick = async () => {
        setLoading(true)
        setError(null)
        const res = await createWalkInAppointment(patientId)
        if (res?.success) {
            window.location.href = `/doctor/prescriptions/new/${res.appointmentId}`
        } else {
            setError((res as any)?.error || 'Failed')
            setLoading(false)
        }
    }

    return (
        <div>
            <button onClick={handleClick} disabled={loading} className="btn btn-primary shadow-lg shadow-blue-500/20">
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <FileText size={16} className="mr-2" />}
                Write Prescription
            </button>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

function DeletePatientButton({ patientId }: { patientId: string }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        setError(null)
        const res = await deletePatient(patientId)
        if (res.success) {
            router.push('/doctor/patients')
        } else {
            setError(res.error || 'Failed to delete')
            setLoading(false)
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-semibold">Delete patient and all records?</span>
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                    {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
                    Confirm
                </button>
                <button onClick={() => setShowConfirm(false)} className="btn btn-sm btn-secondary">
                    Cancel
                </button>
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        )
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="btn btn-sm bg-white border border-red-200 text-red-600 hover:bg-red-50"
        >
            <Trash2 size={14} className="mr-1" /> Delete Patient
        </button>
    )
}

function TypeBadge({ type }: { type: string | null }) {
    if (type === 'online') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">Online</span>
    if (type === 'walk_in') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">Walk-in</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">In-clinic</span>
}

export default function PatientDetail({ patient, prescriptions }: { patient: any; prescriptions: any[] }) {
    const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : null

    return (
        <div className="space-y-6 animate-enter">
            {/* Back link */}
            <Link href="/doctor/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium">
                <ArrowLeft size={16} /> Back to Patients
            </Link>

            {/* Patient Profile Card */}
            <div className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                            {patient.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{patient.full_name}</h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {patient.gender}{age ? ` • ${age} years` : ''} • {patient.registration_number}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <WalkInButton patientId={patient.id} />
                        <DeletePatientButton patientId={patient.id} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
                    {patient.phone && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <Phone size={14} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Phone</p>
                                <a href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 font-medium hover:underline">{patient.phone}</a>
                            </div>
                        </div>
                    )}
                    {patient.address && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <MapPin size={14} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Address</p>
                                <p className="text-sm text-slate-700">{patient.address}</p>
                            </div>
                        </div>
                    )}
                    {patient.dob && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <Calendar size={14} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Date of Birth</p>
                                <p className="text-sm text-slate-700">{new Date(patient.dob).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-slate-500" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Registered</p>
                            <p className="text-sm text-slate-700" suppressHydrationWarning>{new Date(patient.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visit History */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Visit History</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    {prescriptions.length} {prescriptions.length === 1 ? 'visit' : 'visits'}
                </span>
            </div>

            {prescriptions.length === 0 ? (
                <div className="card p-12 text-center">
                    <FileText size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 font-medium">No visits recorded yet</p>
                    <p className="text-sm text-slate-400 mt-1">Click &quot;Write Prescription&quot; to record the first visit.</p>
                </div>
            ) : (
                <div className="card overflow-hidden divide-y divide-slate-100">
                    {prescriptions.map((rx) => {
                        const meds = (rx.medications as any[]) || []
                        const medNames = meds.slice(0, 3).map((m: any) => m.name).join(', ')
                        const apptType = rx.appointments?.appointment_type || null

                        return (
                            <Link
                                key={rx.id}
                                href={`/doctor/prescriptions/${rx.id}`}
                                className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-900 text-sm" suppressHydrationWarning>
                                                {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                            <TypeBadge type={apptType} />
                                        </div>

                                        {rx.diagnosis && (
                                            <p className="text-sm text-slate-600 mt-1 truncate">
                                                <span className="font-medium">Diagnosis:</span> {rx.diagnosis}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                            {meds.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Pill size={12} /> {meds.length} med{meds.length > 1 ? 's' : ''} — {medNames}{meds.length > 3 ? '...' : ''}
                                                </span>
                                            )}
                                            {rx.follow_up_date && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> Follow-up: {new Date(rx.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <Link
                                        href={`/doctor/prescriptions/${rx.id}/edit`}
                                        onClick={e => e.stopPropagation()}
                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </Link>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
