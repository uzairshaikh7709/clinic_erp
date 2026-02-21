'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Printer, Loader2, Pill, Activity, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { savePrescription } from '../actions'

export default function PrescriptionEditor({ doctor, patient, appointmentId, initialData, templates = [] }: any) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState('')

    // Form State
    const [medications, setMedications] = useState<any[]>(
        initialData?.medications || [{ name: '', dosage: '', frequency: '', duration: '', qty: '', instruction: '' }]
    )

    const [formData, setFormData] = useState({
        history: initialData?.history || '',
        findings: initialData?.examinations || '',
        diagnosis: initialData?.diagnosis || '',
        investigations: initialData?.investigations || '',
        advice: initialData?.advice || '',
        follow_up_days: initialData?.follow_up_date
            ? Math.round((new Date(initialData.follow_up_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 7
    })

    const handleTemplateSelect = (e: any) => {
        const templateId = e.target.value
        setSelectedTemplate(templateId)
        if (!templateId) return

        const tmpl = templates.find((t: any) => t.id === templateId)
        if (tmpl && tmpl.medications && tmpl.medications.length > 0) {
            setMedications(tmpl.medications)
        }
    }

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', qty: '', instruction: '' }])
    }

    const removeMedication = (index: number) => {
        if (medications.length === 1) return
        setMedications(medications.filter((_, i) => i !== index))
    }

    const updateMedication = (index: number, field: string, value: string) => {
        const newMeds = [...medications]
        newMeds[index][field] = value
        setMedications(newMeds)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Calculate follow-up date
            const followUpDate = new Date()
            followUpDate.setDate(followUpDate.getDate() + (Number(formData.follow_up_days) || 7))

            // Use Server Action to bypass RLS
            const payload: any = {
                appointment_id: appointmentId,
                doctor_id: doctor.id,
                patient_id: patient.id,
                medications: medications.filter(m => m.name.trim() !== ''),
                history: formData.history,
                examinations: formData.findings,
                diagnosis: formData.diagnosis,
                investigations: formData.investigations,
                advice: formData.advice,
                follow_up_date: followUpDate.toISOString()
            }

            if (initialData?.id) {
                payload.id = initialData.id
            }

            const result = await savePrescription(payload)

            if (result.error) throw new Error(result.error)

            // Redirect to print/view page
            router.push(`/doctor/prescriptions/${result.prescriptionId}`)
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-enter">

            {/* Left Column: Clinical Notes */}

            {/* Left Column: Clinical Notes */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-[#0077B6]" /> Clinical Notes
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Chief Complaints / History</label>
                            <textarea
                                className="input w-full min-h-[80px]"
                                placeholder="Patient history..."
                                value={formData.history}
                                onChange={e => setFormData({ ...formData, history: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Clinical Findings</label>
                            <textarea
                                className="input w-full min-h-[80px]"
                                placeholder="Examination notes..."
                                value={formData.findings}
                                onChange={e => setFormData({ ...formData, findings: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Diagnosis</label>
                            <input
                                className="input w-full"
                                placeholder="e.g. Acute Viral Fever"
                                value={formData.diagnosis}
                                onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Investigations Required</label>
                            <textarea
                                className="input w-full min-h-[60px]"
                                placeholder="Lab tests, X-rays..."
                                value={formData.investigations}
                                onChange={e => setFormData({ ...formData, investigations: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Rx & Advice */}
            <div className="lg:col-span-2 space-y-6">

                {/* Rx */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Pill size={18} className="text-[#0077B6]" /> Rx
                        </h3>
                        <button onClick={addMedication} className="btn btn-sm btn-secondary text-xs cursor-pointer">
                            <Plus size={14} className="mr-1" /> Add Medicine
                        </button>
                    </div>

                    {/* Template Selector */}
                    {templates.length > 0 && (
                        <div className="mb-4">
                            <select
                                className="select h-9 text-sm w-full sm:w-64 border-indigo-200 bg-indigo-50/50"
                                value={selectedTemplate}
                                onChange={handleTemplateSelect}
                            >
                                <option value="">-- Load from Template --</option>
                                {templates.map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-3">
                        {/* Header - desktop only (matches real prescription: Medicine | Dosage | Duration | Qty | Instructions) */}
                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-2 border-b border-slate-200 pb-2">
                            <div className="col-span-4">Medicine</div>
                            <div className="col-span-2">Dosage</div>
                            <div className="col-span-2">Duration</div>
                            <div className="col-span-1">Qty</div>
                            <div className="col-span-2">Instructions</div>
                            <div className="col-span-1"></div>
                        </div>

                        {medications.map((med, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {/* Mobile stacked layout */}
                                <div className="md:hidden space-y-2">
                                    <div className="flex items-start justify-between">
                                        <span className="text-xs font-semibold text-slate-500">{idx + 1})</span>
                                        <button onClick={() => removeMedication(idx)} className="text-red-400 hover:text-red-600 cursor-pointer p-1"><Trash2 size={14} /></button>
                                    </div>
                                    <input placeholder="e.g. TAB ACECLOFENAC SP 100MG" className="input h-9 w-full text-sm" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input placeholder="1-0-1" className="input h-8 w-full text-xs" value={med.frequency} onChange={e => updateMedication(idx, 'frequency', e.target.value)} />
                                        <input placeholder="Duration" className="input h-8 w-full text-xs" value={med.duration} onChange={e => updateMedication(idx, 'duration', e.target.value)} />
                                        <input placeholder="Qty" className="input h-8 w-full text-xs" value={med.qty || ''} onChange={e => updateMedication(idx, 'qty', e.target.value)} />
                                    </div>
                                    <input placeholder="Instructions (e.g. After food)" className="input h-7 w-full text-xs text-slate-500 bg-white" value={med.instruction} onChange={e => updateMedication(idx, 'instruction', e.target.value)} />
                                </div>
                                {/* Desktop grid layout (matches real prescription columns) */}
                                <div className="hidden md:grid grid-cols-12 gap-2 items-start">
                                    <div className="col-span-4">
                                        <input placeholder="e.g. TAB ACECLOFENAC SP 100MG/325MG" className="input h-8 w-full text-sm" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <input placeholder="1-0-1" className="input h-8 w-full text-sm" value={med.frequency} onChange={e => updateMedication(idx, 'frequency', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <input placeholder="8 DAYS" className="input h-8 w-full text-sm" value={med.duration} onChange={e => updateMedication(idx, 'duration', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <input placeholder="Qty" className="input h-8 w-full text-sm text-center" value={med.qty || ''} onChange={e => updateMedication(idx, 'qty', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <input placeholder="After food" className="input h-8 w-full text-sm" value={med.instruction} onChange={e => updateMedication(idx, 'instruction', e.target.value)} />
                                    </div>
                                    <div className="col-span-1 flex justify-center pt-1">
                                        <button onClick={() => removeMedication(idx)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Advice & Follow Up */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-[#0077B6]" /> Advice & Follow-up
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">General Advice</label>
                            <textarea
                                className="input w-full min-h-[80px]"
                                placeholder="Diet restrictions, rest..."
                                value={formData.advice}
                                onChange={e => setFormData({ ...formData, advice: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Follow up after</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    className="input w-24"
                                    value={formData.follow_up_days}
                                    onChange={e => setFormData({ ...formData, follow_up_days: Number(e.target.value) })}
                                />
                                <span className="text-slate-500 text-sm">Days</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2" suppressHydrationWarning>
                                Expected date: {(() => {
                                    const d = new Date()
                                    d.setDate(d.getDate() + (Number(formData.follow_up_days) || 0))
                                    return d.toLocaleDateString()
                                })()}
                            </p>
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm text-red-500 px-2">{error}</p>}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn btn-ghost text-slate-500 cursor-pointer w-full sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary h-12 px-6 sm:px-8 shadow-lg shadow-blue-500/20 cursor-pointer w-full sm:w-auto"
                    >
                        {saving ? (
                            <><Loader2 className="animate-spin mr-2" /> Saving...</>
                        ) : (
                            <><Save size={18} className="mr-2" /> {initialData ? 'Update' : 'Save'} Prescription</>
                        )}
                    </button>
                </div>

            </div>
        </div >
    )
}
