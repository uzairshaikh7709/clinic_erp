'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { saveCertificate } from './actions'

const CERTIFICATE_TYPES = [
    'Medical Fitness Certificate',
    'Sick Leave Certificate',
    'Disability Certificate',
    'Medical Certificate',
    'Fitness to Travel Certificate',
    'Vaccination Certificate',
    'Other',
]

type FormData = {
    patient_name: string
    age: string
    sex: string
    address: string
    certificate_type: string
    description: string
    date: string
}

interface Props {
    initialData?: FormData & { id: string }
}

export default function CertificateForm({ initialData }: Props) {
    const router = useRouter()
    const isEdit = !!initialData

    const [form, setForm] = useState<FormData>({
        patient_name: initialData?.patient_name || '',
        age: initialData?.age || '',
        sex: initialData?.sex || 'Male',
        address: initialData?.address || '',
        certificate_type: initialData?.certificate_type || 'Medical Certificate',
        description: initialData?.description || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const update = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const canSave = form.patient_name.trim() && form.age.trim()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSave) return

        setSaving(true)
        setError(null)

        try {
            const result = await saveCertificate({
                ...(initialData?.id ? { id: initialData.id } : {}),
                patient_name: form.patient_name.trim(),
                age: form.age.trim(),
                sex: form.sex,
                address: form.address.trim() || undefined,
                certificate_type: form.certificate_type,
                description: form.description.trim() || undefined,
                date: form.date,
            })

            if (result.error) throw new Error(result.error)
            router.push(`/doctor/certifications/${result.certificateId}`)
        } catch (err: any) {
            setError(err.message || 'Failed to save certificate')
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-enter max-w-3xl">
            <div>
                <Link href="/doctor/certifications" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm mb-3">
                    <ArrowLeft size={16} /> Back to Certifications
                </Link>
                <div className="flex items-center gap-2">
                    <Award size={20} className="text-slate-400" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                        {isEdit ? 'Edit Certificate' : 'New Certificate'}
                    </h1>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                    {isEdit ? 'Update certificate details' : 'Create a new medical certificate'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                        <Award size={18} className="text-[#0077B6]" />
                        <h2 className="font-bold text-slate-800">Certificate Details</h2>
                    </div>
                    <div className="p-4 sm:p-6 space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
                        )}

                        {/* Certificate Type + Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Certificate Type</label>
                                <select
                                    className="select w-full"
                                    value={form.certificate_type}
                                    onChange={e => update('certificate_type', e.target.value)}
                                >
                                    {CERTIFICATE_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="date"
                                    className="input w-full"
                                    value={form.date}
                                    onChange={e => update('date', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Patient Info */}
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Patient Information</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Patient Name *</label>
                                    <input
                                        className="input w-full"
                                        placeholder="Full name"
                                        value={form.patient_name}
                                        onChange={e => update('patient_name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Age *</label>
                                        <input
                                            className="input w-full"
                                            placeholder="e.g. 32"
                                            value={form.age}
                                            onChange={e => update('age', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Sex</label>
                                        <select
                                            className="select w-full"
                                            value={form.sex}
                                            onChange={e => update('sex', e.target.value)}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="label">Address</label>
                                <input
                                    className="input w-full"
                                    placeholder="Patient address (optional)"
                                    value={form.address}
                                    onChange={e => update('address', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="label">Certificate Content</label>
                            <textarea
                                className="input w-full min-h-[150px]"
                                placeholder="Enter the certificate body text. Leave blank for a default template."
                                value={form.description}
                                onChange={e => update('description', e.target.value)}
                            />
                            <p className="text-xs text-slate-400 mt-1">If left blank, a default statement will be generated.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={!canSave || saving}
                                className="btn btn-primary w-full sm:w-auto min-w-[200px] justify-center disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><Award size={18} className="mr-2" /> {isEdit ? 'Update Certificate' : 'Save Certificate'}</>
                                )}
                            </button>
                            <Link
                                href="/doctor/certifications"
                                className="btn btn-secondary w-full sm:w-auto justify-center"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
