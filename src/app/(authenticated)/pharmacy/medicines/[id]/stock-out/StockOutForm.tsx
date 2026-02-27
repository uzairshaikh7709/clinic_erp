'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stockOut } from '../../../actions'
import { Loader2, AlertTriangle } from 'lucide-react'

interface Batch {
    id: string
    batch_number: string
    expiry_date: string
    quantity_remaining: number
}

export default function StockOutForm({ medicineId, medicineName, unit, batches }: {
    medicineId: string; medicineName: string; unit: string; batches: Batch[]
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedBatch, setSelectedBatch] = useState(batches[0]?.id || '')

    const currentBatch = batches.find(b => b.id === selectedBatch)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set('medicine_id', medicineId)

        try {
            const result = await stockOut(formData)
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

    if (batches.length === 0) {
        return (
            <div className="card p-8 text-center max-w-2xl">
                <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
                <p className="font-medium text-slate-800">No stock available</p>
                <p className="text-sm text-slate-500 mt-1">This medicine has no batches with remaining stock.</p>
                <button onClick={() => router.back()} className="btn btn-secondary mt-4">Go Back</button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4 sm:p-6 max-w-2xl">
            <div className="space-y-4">
                <div>
                    <label className="label">Batch (FIFO - earliest expiry first) *</label>
                    <select
                        name="batch_id"
                        required
                        className="select w-full"
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                    >
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.batch_number} — Exp: {b.expiry_date} — Remaining: {b.quantity_remaining} {unit}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Quantity ({unit}) *</label>
                    <input
                        name="quantity"
                        type="number"
                        min="1"
                        max={currentBatch?.quantity_remaining || 0}
                        required
                        className="input w-full sm:w-40"
                        placeholder="0"
                    />
                    {currentBatch && (
                        <p className="text-xs text-slate-400 mt-1">Max: {currentBatch.quantity_remaining} {unit}</p>
                    )}
                </div>

                <div>
                    <label className="label">Reason</label>
                    <input name="reason" className="input w-full" placeholder="e.g. Dispensed to patient, clinic use" />
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading && <Loader2 size={16} className="animate-spin mr-1.5" />}
                        Dispense Stock
                    </button>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    )
}
