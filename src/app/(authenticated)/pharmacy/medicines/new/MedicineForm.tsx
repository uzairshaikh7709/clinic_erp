'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMedicine, updateMedicine } from '../../actions'
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other']
const UNITS = ['pcs', 'strips', 'bottles', 'tubes', 'vials']

interface MedicineFormProps {
    medicine?: {
        id: string
        name: string
        generic_name: string | null
        category: string | null
        manufacturer: string | null
        unit: string
        low_stock_threshold: number
    }
}

export default function MedicineForm({ medicine }: MedicineFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        try {
            const result = medicine
                ? await updateMedicine(formData)
                : await createMedicine(formData)

            if (result.error) {
                setError(result.error)
                return
            }

            if (medicine) {
                router.push(`/pharmacy/medicines/${medicine.id}`)
            } else {
                router.push(`/pharmacy/medicines/${(result as any).medicineId}`)
            }
            router.refresh()
        } catch {
            setError('Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4 sm:p-6 max-w-2xl">
            {medicine && <input type="hidden" name="id" value={medicine.id} />}

            <div className="space-y-4">
                <div>
                    <label className="label">Medicine Name *</label>
                    <input name="name" defaultValue={medicine?.name || ''} required className="input w-full" placeholder="e.g. Paracetamol 500mg" autoFocus />
                </div>

                <div>
                    <label className="label">Generic Name</label>
                    <input name="generic_name" defaultValue={medicine?.generic_name || ''} className="input w-full" placeholder="e.g. Acetaminophen" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Category</label>
                        <select name="category" defaultValue={medicine?.category || ''} className="select w-full">
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Unit</label>
                        <select name="unit" defaultValue={medicine?.unit || 'pcs'} className="select w-full">
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Manufacturer</label>
                    <input name="manufacturer" defaultValue={medicine?.manufacturer || ''} className="input w-full" placeholder="e.g. Sun Pharma" />
                </div>

                <div>
                    <label className="label">Low Stock Threshold</label>
                    <input name="low_stock_threshold" type="number" min="0" defaultValue={medicine?.low_stock_threshold ?? 10} className="input w-full sm:w-40" />
                    <p className="text-xs text-slate-400 mt-1">Alert when stock falls below this quantity</p>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading && <Loader2 size={16} className="animate-spin mr-1.5" />}
                        {medicine ? 'Save Changes' : 'Add Medicine'}
                    </button>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    )
}
