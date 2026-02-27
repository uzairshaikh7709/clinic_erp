'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stockIn } from '../../../actions'
import { Loader2 } from 'lucide-react'

export default function StockInForm({ medicineId, medicineName, unit }: {
    medicineId: string; medicineName: string; unit: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set('medicine_id', medicineId)

        try {
            const result = await stockIn(formData)
            if (result.error) {
                setError(result.error)
                return
            }
            router.push(`/pharmacy/medicines/${medicineId}`)
            router.refresh()
        } catch {
            setError('Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4 sm:p-6 max-w-2xl">
            <div className="space-y-4">
                <div>
                    <label className="label">Batch Number *</label>
                    <input name="batch_number" required className="input w-full" placeholder="e.g. BN-2026-001" autoFocus />
                </div>

                <div>
                    <label className="label">Expiry Date *</label>
                    <input name="expiry_date" type="date" required className="input w-full sm:w-auto" />
                </div>

                <div>
                    <label className="label">Quantity ({unit}) *</label>
                    <input name="quantity" type="number" min="1" required className="input w-full sm:w-40" placeholder="0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Purchase Price (per {unit})</label>
                        <input name="purchase_price" type="number" step="0.01" min="0" className="input w-full" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="label">Selling Price (per {unit})</label>
                        <input name="selling_price" type="number" step="0.01" min="0" className="input w-full" placeholder="0.00" />
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading && <Loader2 size={16} className="animate-spin mr-1.5" />}
                        Add Stock
                    </button>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    )
}
