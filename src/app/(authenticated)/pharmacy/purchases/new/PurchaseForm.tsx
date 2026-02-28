'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchase } from '../../purchase-actions'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'

type SupplierOption = { id: string; name: string }
type MedicineOption = { id: string; name: string; generic_name: string | null; unit: string; gst_rate: number }

type PurchaseLineItem = {
    key: number
    medicine_id: string
    batch_number: string
    expiry_date: string
    quantity_ordered: string
    free_quantity: string
    purchase_price: string
    selling_price: string
    mrp: string
    gst_rate: string
    discount_pct: string
}

const emptyItem = (key: number): PurchaseLineItem => ({
    key,
    medicine_id: '',
    batch_number: '',
    expiry_date: '',
    quantity_ordered: '',
    free_quantity: '0',
    purchase_price: '',
    selling_price: '',
    mrp: '',
    gst_rate: '12',
    discount_pct: '0',
})

export default function PurchaseForm({ suppliers, medicines }: { suppliers: SupplierOption[]; medicines: MedicineOption[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [items, setItems] = useState<PurchaseLineItem[]>([emptyItem(1)])
    let nextKey = items.length + 1

    function addItem() {
        setItems(prev => [...prev, emptyItem(nextKey++)])
    }

    function removeItem(key: number) {
        if (items.length <= 1) return
        setItems(prev => prev.filter(i => i.key !== key))
    }

    function updateItem(key: number, field: string, value: string) {
        setItems(prev => prev.map(i => {
            if (i.key !== key) return i
            const updated = { ...i, [field]: value }
            // Auto-fill GST rate from medicine selection
            if (field === 'medicine_id') {
                const med = medicines.find(m => m.id === value)
                if (med) updated.gst_rate = String(med.gst_rate || 12)
            }
            return updated
        }))
    }

    function calculateLineTotal(item: PurchaseLineItem) {
        const qty = parseInt(item.quantity_ordered) || 0
        const price = parseFloat(item.purchase_price) || 0
        const gst = parseFloat(item.gst_rate) || 0
        const disc = parseFloat(item.discount_pct) || 0
        const gross = qty * price
        const discounted = gross - (gross * disc / 100)
        return discounted + (discounted * gst / 100)
    }

    const grandTotal = items.reduce((sum, i) => sum + calculateLineTotal(i), 0)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.set('items', JSON.stringify(items))

        const result = await createPurchase(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push(`/pharmacy/purchases/${result.purchaseId}`)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">{error}</div>
            )}

            {/* Header Fields */}
            <div className="card p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="label">Supplier *</label>
                        <select name="supplier_id" required className="select w-full">
                            <option value="">Select supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Purchase Date</label>
                        <input type="date" name="purchase_date" defaultValue={new Date().toISOString().split('T')[0]} className="input w-full" />
                    </div>
                    <div>
                        <label className="label">Supplier Invoice #</label>
                        <input name="invoice_number" className="input w-full" placeholder="INV-XXXXX" />
                    </div>
                    <div>
                        <label className="label">Invoice Date</label>
                        <input type="date" name="invoice_date" className="input w-full" />
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={18} className="text-indigo-400" />
                        <h3 className="font-bold text-slate-800">Items</h3>
                    </div>
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                                    <label className="text-xs font-medium text-slate-500">Medicine *</label>
                                    <select
                                        value={item.medicine_id}
                                        onChange={e => updateItem(item.key, 'medicine_id', e.target.value)}
                                        required
                                        className="select w-full text-sm"
                                    >
                                        <option value="">Select medicine</option>
                                        {medicines.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}{m.generic_name ? ` (${m.generic_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Batch # *</label>
                                    <input
                                        value={item.batch_number}
                                        onChange={e => updateItem(item.key, 'batch_number', e.target.value)}
                                        required
                                        className="input w-full text-sm"
                                        placeholder="e.g. B2024A"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Expiry *</label>
                                    <input
                                        type="date"
                                        value={item.expiry_date}
                                        onChange={e => updateItem(item.key, 'expiry_date', e.target.value)}
                                        required
                                        className="input w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Qty *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity_ordered}
                                        onChange={e => updateItem(item.key, 'quantity_ordered', e.target.value)}
                                        required
                                        className="input w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Free Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.free_quantity}
                                        onChange={e => updateItem(item.key, 'free_quantity', e.target.value)}
                                        className="input w-full text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Purchase Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.purchase_price}
                                        onChange={e => updateItem(item.key, 'purchase_price', e.target.value)}
                                        required
                                        className="input w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Selling Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.selling_price}
                                        onChange={e => updateItem(item.key, 'selling_price', e.target.value)}
                                        required
                                        className="input w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">MRP</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.mrp}
                                        onChange={e => updateItem(item.key, 'mrp', e.target.value)}
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
                                        <option value="28">28%</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Discount %</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={item.discount_pct}
                                        onChange={e => updateItem(item.key, 'discount_pct', e.target.value)}
                                        className="input w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Line Total</label>
                                    <p className="input w-full text-sm bg-slate-50 flex items-center font-bold text-slate-800">
                                        ₹{calculateLineTotal(item).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="px-4 sm:px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <label className="label">Extra Discount (₹)</label>
                        <input type="number" name="discount" step="0.01" min="0" defaultValue="0" className="input w-32 text-sm" />
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Grand Total</p>
                        <p className="text-2xl font-bold text-slate-900">₹{grandTotal.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Notes & Submit */}
            <div className="card p-6">
                <label className="label">Notes</label>
                <textarea name="notes" className="input w-full" rows={2} placeholder="Any additional notes..." />
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} className="btn btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary text-sm">
                    {loading ? 'Creating...' : 'Create Purchase Order'}
                </button>
            </div>
        </form>
    )
}
