'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createManualInvoice } from '../../actions'
import { Loader2, Plus, Trash2, Clock } from 'lucide-react'

type DispenseItem = {
    name: string
    quantity: string
    unit_price: string
    gst_rate: string
}

const EMPTY_ITEM: DispenseItem = { name: '', quantity: '', unit_price: '', gst_rate: '12' }

export default function ManualDispenseForm({ medicines }: { medicines: { id: string; name: string }[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [patientName, setPatientName] = useState('')
    const [doctorName, setDoctorName] = useState('')
    const [notes, setNotes] = useState('')
    const [items, setItems] = useState<DispenseItem[]>([{ ...EMPTY_ITEM }])
    const [currentTime, setCurrentTime] = useState('')

    useEffect(() => {
        const update = () => {
            setCurrentTime(new Date().toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
            }))
        }
        update()
        const interval = setInterval(update, 60_000)
        return () => clearInterval(interval)
    }, [])

    const addItem = () => setItems([...items, { ...EMPTY_ITEM }])

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof DispenseItem, value: string) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const validItems = items.filter(i => i.name.trim() && parseInt(i.quantity) > 0)
        if (validItems.length === 0) {
            setError('At least one medicine with quantity is required.')
            setLoading(false)
            return
        }

        const formData = new FormData()
        formData.set('patient_name', patientName)
        formData.set('doctor_name', doctorName)
        formData.set('notes', notes)
        formData.set('items', JSON.stringify(validItems))

        try {
            const res = await createManualInvoice(formData)
            if (res.error) {
                setError(res.error)
                return
            }
            router.push(`/pharmacy/invoices/${res.invoiceId}`)
            router.refresh()
        } catch {
            setError('Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    const medicineNames = medicines.map(m => m.name)

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Patient & Doctor Info */}
            <div className="card p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2 w-fit">
                    <Clock size={14} />
                    <span>{currentTime}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Patient Name *</label>
                        <input
                            value={patientName}
                            onChange={e => setPatientName(e.target.value)}
                            required
                            className="input w-full"
                            placeholder="Patient name"
                        />
                    </div>
                    <div>
                        <label className="label">Doctor Name</label>
                        <input
                            value={doctorName}
                            onChange={e => setDoctorName(e.target.value)}
                            className="input w-full"
                            placeholder="Prescribing doctor"
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Notes</label>
                    <input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="input w-full"
                        placeholder="Optional notes"
                    />
                </div>
            </div>

            {/* Medicine Items */}
            <div className="card p-4 sm:p-6">
                <h3 className="font-bold text-slate-800 mb-4">Medicines</h3>

                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-4">
                                {i === 0 && <label className="label">Medicine</label>}
                                <input
                                    list="medicine-suggestions"
                                    value={item.name}
                                    onChange={e => updateItem(i, 'name', e.target.value)}
                                    className="input w-full"
                                    placeholder="Medicine name"
                                />
                            </div>
                            <div className="col-span-3 sm:col-span-2">
                                {i === 0 && <label className="label">Qty</label>}
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                                    className="input w-full"
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-3 sm:col-span-2">
                                {i === 0 && <label className="label">Price (₹)</label>}
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.unit_price}
                                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                                    className="input w-full"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="col-span-3 sm:col-span-2">
                                {i === 0 && <label className="label">GST %</label>}
                                <select
                                    value={item.gst_rate}
                                    onChange={e => updateItem(i, 'gst_rate', e.target.value)}
                                    className="select w-full"
                                >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                </select>
                            </div>
                            <div className="col-span-3 sm:col-span-2 flex gap-2">
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(i)} className="btn btn-secondary p-2">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" onClick={addItem} className="mt-3 text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Medicine
                </button>

                <datalist id="medicine-suggestions">
                    {medicineNames.map(name => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading && <Loader2 size={16} className="animate-spin mr-1.5" />}
                    Confirm Dispense
                </button>
                <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    )
}
