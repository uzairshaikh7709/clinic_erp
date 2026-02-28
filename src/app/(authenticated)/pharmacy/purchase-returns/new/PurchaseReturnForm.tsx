'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchaseReturn, getMedicineBatchesWithStock } from '../../purchase-actions'
import { Plus, Trash2 } from 'lucide-react'

type SupplierOption = { id: string; name: string }
type MedicineOption = { id: string; name: string; generic_name: string | null; unit: string; gst_rate: number }
type BatchOption = { id: string; batch_number: string; expiry_date: string; quantity_remaining: number; purchase_price: number | null }

type ReturnLineItem = {
    key: number
    medicine_id: string
    batch_id: string
    quantity: string
    gst_rate: string
    reason: string
    batches: BatchOption[]
}

export default function PurchaseReturnForm({ suppliers, medicines }: { suppliers: SupplierOption[]; medicines: MedicineOption[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [items, setItems] = useState<ReturnLineItem[]>([{ key: 1, medicine_id: '', batch_id: '', quantity: '', gst_rate: '12', reason: '', batches: [] }])
    let nextKey = 2

    function addItem() {
        setItems(prev => [...prev, { key: nextKey++, medicine_id: '', batch_id: '', quantity: '', gst_rate: '12', reason: '', batches: [] }])
    }

    function removeItem(key: number) {
        if (items.length <= 1) return
        setItems(prev => prev.filter(i => i.key !== key))
    }

    async function handleMedicineChange(key: number, medicineId: string) {
        const med = medicines.find(m => m.id === medicineId)
        const batches = medicineId ? await getMedicineBatchesWithStock('', medicineId) : []

        setItems(prev => prev.map(i => {
            if (i.key !== key) return i
            return { ...i, medicine_id: medicineId, batch_id: '', batches, gst_rate: String(med?.gst_rate || 12) }
        }))
    }

    function updateItem(key: number, field: string, value: string) {
        setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.set('items', JSON.stringify(items.map(i => ({
            medicine_id: i.medicine_id,
            batch_id: i.batch_id,
            quantity: i.quantity,
            gst_rate: i.gst_rate,
            reason: i.reason,
        }))))

        const result = await createPurchaseReturn(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/pharmacy/purchase-returns')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">{error}</div>
            )}

            <div className="card p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Supplier *</label>
                        <select name="supplier_id" required className="select w-full">
                            <option value="">Select supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Return Reason *</label>
                        <input name="reason" required className="input w-full" placeholder="e.g. Expired stock, Damaged goods" />
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Return Items</h3>
                    <button type="button" onClick={addItem} className="btn btn-ghost text-sm text-indigo-600">
                        <Plus size={16} className="mr-1" /> Add Item
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {items.map((item, idx) => (
                        <div key={item.key} className="border border-slate-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-500">Item {idx + 1}</span>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(item.key)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Medicine *</label>
                                    <select
                                        value={item.medicine_id}
                                        onChange={e => handleMedicineChange(item.key, e.target.value)}
                                        required
                                        className="select w-full text-sm"
                                    >
                                        <option value="">Select medicine</option>
                                        {medicines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Batch *</label>
                                    <select
                                        value={item.batch_id}
                                        onChange={e => updateItem(item.key, 'batch_id', e.target.value)}
                                        required
                                        disabled={!item.medicine_id}
                                        className="select w-full text-sm"
                                    >
                                        <option value="">Select batch</option>
                                        {item.batches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.batch_number} (Exp: {b.expiry_date}, Qty: {b.quantity_remaining})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Qty to Return *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => updateItem(item.key, 'quantity', e.target.value)}
                                        required
                                        className="input w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">GST %</label>
                                    <select
                                        value={item.gst_rate}
                                        onChange={e => updateItem(item.key, 'gst_rate', e.target.value)}
                                        className="select w-full text-sm"
                                    >
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card p-6">
                <label className="label">Notes</label>
                <textarea name="notes" className="input w-full" rows={2} placeholder="Additional notes..." />
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} className="btn btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary text-sm">
                    {loading ? 'Creating...' : 'Create Return'}
                </button>
            </div>
        </form>
    )
}
