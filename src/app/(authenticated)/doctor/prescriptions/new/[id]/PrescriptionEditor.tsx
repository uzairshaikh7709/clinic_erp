'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Printer, Loader2, Pill, Activity, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { savePrescription } from '../actions'

export default function PrescriptionEditor({ doctor, patient, appointmentId, initialData }: any) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    // Form State
    const [medications, setMedications] = useState<any[]>(
        initialData?.medications || [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
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

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instruction: '' }])
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
            router.refresh()
        } catch (err: any) {
            console.error(err)
            alert('Failed to save prescription: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Left Column: Clinical Notes */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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

                {/* Medications */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Pill size={18} className="text-[#0077B6]" /> Rx / Medications
                        </h3>
                        <button onClick={addMedication} className="btn btn-sm btn-secondary text-xs cursor-pointer">
                            <Plus size={14} className="mr-1" /> Add Medicine
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-2">
                            <div className="col-span-4">Medicine Name</div>
                            <div className="col-span-2">Dosage</div>
                            <div className="col-span-2">Freq</div>
                            <div className="col-span-2">Duration</div>
                            <div className="col-span-2">Actions</div>
                        </div>

                        {medications.map((med, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div className="col-span-4 space-y-1">
                                    <input
                                        placeholder="Name (e.g. Paracetamol)"
                                        className="input h-8 w-full text-sm"
                                        value={med.name}
                                        onChange={e => updateMedication(idx, 'name', e.target.value)}
                                    />
                                    <input
                                        placeholder="Instruction (e.g. After food)"
                                        className="input h-7 w-full text-xs text-slate-500 bg-white"
                                        value={med.instruction}
                                        onChange={e => updateMedication(idx, 'instruction', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        placeholder="500mg"
                                        className="input h-8 w-full text-sm"
                                        value={med.dosage}
                                        onChange={e => updateMedication(idx, 'dosage', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <select
                                        className="input h-8 w-full text-sm p-1 cursor-pointer"
                                        value={med.frequency}
                                        onChange={e => updateMedication(idx, 'frequency', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="1-0-1">1-0-1</option>
                                        <option value="1-0-0">1-0-0</option>
                                        <option value="0-0-1">0-0-1</option>
                                        <option value="1-1-1">1-1-1</option>
                                        <option value="SOS">SOS</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        placeholder="5 days"
                                        className="input h-8 w-full text-sm"
                                        value={med.duration}
                                        onChange={e => updateMedication(idx, 'duration', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 flex justify-center pt-1">
                                    <button
                                        onClick={() => removeMedication(idx)}
                                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Advice & Follow Up */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => router.push('/doctor/appointments')}
                        className="btn btn-ghost text-slate-500 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary h-12 px-8 shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                        {saving ? (
                            <><Loader2 className="animate-spin mr-2" /> Saving...</>
                        ) : (
                            <><Save size={18} className="mr-2" /> {initialData ? 'Update' : 'Save'} Prescription</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
