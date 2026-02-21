'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Save, FileText, Loader2, Pill, Search, ArrowUpDown } from 'lucide-react'
import { saveTemplate, deleteTemplate } from './actions'
import { useRouter } from 'next/navigation'

export default function TemplatesPage({ templates }: { templates: any[] }) {
    const router = useRouter()
    const [view, setView] = useState<'list' | 'edit'>('list')
    const [template, setTemplate] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [nameError, setNameError] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<'name' | 'date'>('date')

    const handleCreate = () => {
        setTemplate({
            name: '',
            medications: [{ name: '', frequency: '', duration: '', qty: '', instruction: '' }],
        })
        setView('edit')
    }

    const handleEdit = (t: any) => {
        setTemplate(t)
        setView('edit')
    }

    const handleSave = async () => {
        if (!template.name) {
            setNameError(true)
            return
        }
        setNameError(false)
        setError(null)
        setSaving(true)
        try {
            const res = await saveTemplate(template)
            if (res.error) throw new Error(res.error)
            setView('list')
            router.refresh()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return
        setDeleteError(null)
        try {
            const res = await deleteTemplate(id)
            if (res.error) throw new Error(res.error)
            router.refresh()
        } catch (e: any) {
            setDeleteError(e.message)
        }
    }

    const updateField = (field: string, value: any) => {
        setTemplate({ ...template, [field]: value })
    }

    const updateMedication = (index: number, field: string, value: string) => {
        const newMeds = [...template.medications]
        newMeds[index][field] = value
        setTemplate({ ...template, medications: newMeds })
    }
    const addMedication = () => {
        setTemplate({
            ...template,
            medications: [...template.medications, { name: '', frequency: '', duration: '', qty: '', instruction: '' }]
        })
    }
    const removeMedication = (index: number) => {
        if (template.medications.length === 1) return
        setTemplate({
            ...template,
            medications: template.medications.filter((_: any, i: number) => i !== index)
        })
    }

    if (view === 'edit') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{template.id ? 'Edit Template' : 'New Template'}</h1>
                    <button onClick={() => setView('list')} className="btn btn-ghost text-sm">Cancel</button>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <label className="label">Template Name</label>
                        <input
                            className={`input ${nameError ? 'border-red-300' : ''}`}
                            value={template.name}
                            onChange={(e) => { updateField('name', e.target.value); setNameError(false) }}
                            placeholder="e.g. Viral Fever Protocol"
                        />
                        {nameError && <p className="text-xs text-red-500 mt-1">Template name is required</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm sm:text-base">Rx</h3>
                            <button onClick={addMedication} className="btn btn-sm btn-secondary text-xs"><Plus size={14} /> Add</button>
                        </div>

                        {/* Desktop header */}
                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-1 mb-2 border-b border-slate-200 pb-2">
                            <div className="col-span-4">Medicine</div>
                            <div className="col-span-2">Dosage</div>
                            <div className="col-span-2">Duration</div>
                            <div className="col-span-1">Qty</div>
                            <div className="col-span-2">Instructions</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* Mobile: stacked layout */}
                        <div className="md:hidden space-y-3">
                            {template.medications.map((med: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">{idx + 1})</span>
                                        <button onClick={() => removeMedication(idx)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                                    </div>
                                    <input className="input h-8 text-sm w-full" placeholder="e.g. TAB ACECLOFENAC SP 100MG" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input className="input h-8 text-xs" placeholder="1-0-1" value={med.frequency} onChange={e => updateMedication(idx, 'frequency', e.target.value)} />
                                        <input className="input h-8 text-xs" placeholder="Duration" value={med.duration} onChange={e => updateMedication(idx, 'duration', e.target.value)} />
                                        <input className="input h-8 text-xs" placeholder="Qty" value={med.qty || ''} onChange={e => updateMedication(idx, 'qty', e.target.value)} />
                                    </div>
                                    <input className="input h-7 text-xs w-full text-slate-500" placeholder="Instructions (e.g. After food)" value={med.instruction || ''} onChange={e => updateMedication(idx, 'instruction', e.target.value)} />
                                </div>
                            ))}
                        </div>

                        {/* Desktop: grid layout */}
                        <div className="hidden md:block space-y-2">
                            {template.medications.map((med: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg">
                                    <input className="col-span-4 input h-8 text-sm" placeholder="e.g. TAB ACECLOFENAC SP 100MG/325MG" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} />
                                    <input className="col-span-2 input h-8 text-sm" placeholder="1-0-1" value={med.frequency} onChange={e => updateMedication(idx, 'frequency', e.target.value)} />
                                    <input className="col-span-2 input h-8 text-sm" placeholder="8 DAYS" value={med.duration} onChange={e => updateMedication(idx, 'duration', e.target.value)} />
                                    <input className="col-span-1 input h-8 text-sm text-center" placeholder="Qty" value={med.qty || ''} onChange={e => updateMedication(idx, 'qty', e.target.value)} />
                                    <input className="col-span-2 input h-8 text-sm" placeholder="After food" value={med.instruction || ''} onChange={e => updateMedication(idx, 'instruction', e.target.value)} />
                                    <div className="col-span-1 flex justify-center pt-1"><button onClick={() => removeMedication(idx)} className="text-red-500"><Trash2 size={16} /></button></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="pt-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full sm:w-auto">
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />} Save Template
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Filter & sort templates
    const filtered = templates.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase())
    )
    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
        return 0 // already sorted by created_at desc from server
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Prescription Templates</h1>
                    <p className="text-slate-500 text-sm">Manage reusable protocols</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary text-sm">
                    <Plus size={16} className="mr-1.5" /> New Template
                </button>
            </div>

            {/* Search + Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="input pl-10 h-10 bg-white w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setSort(sort === 'name' ? 'date' : 'name')}
                    className={`btn btn-sm ${sort === 'name' ? 'btn-secondary' : 'bg-white border text-slate-600'}`}
                >
                    <ArrowUpDown size={14} className="mr-1" /> {sort === 'name' ? 'A-Z' : 'Recent'}
                </button>
            </div>

            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

            {sorted.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{search ? 'No templates match your search.' : 'No templates yet. Create one to get started.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {sorted.map((t) => (
                        <div key={t.id} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-[#0077B6] flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base">{t.name}</h3>
                            <div className="text-xs text-slate-500 space-y-1">
                                <p className="flex items-center gap-2"><Pill size={12} /> {t.medications?.length || 0} Medications</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
