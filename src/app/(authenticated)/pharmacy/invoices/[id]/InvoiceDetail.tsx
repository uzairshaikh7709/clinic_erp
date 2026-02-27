'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordPayment, applyDiscount } from '../../actions'
import { Loader2 } from 'lucide-react'

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
]

export default function InvoiceDetail({ invoice, items, payments }: {
    invoice: any; items: any[]; payments: any[]
}) {
    const router = useRouter()
    const [payLoading, setPayLoading] = useState(false)
    const [discountLoading, setDiscountLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPayForm, setShowPayForm] = useState(false)
    const [showDiscountForm, setShowDiscountForm] = useState(false)

    const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
    const remaining = Number(invoice.grand_total) - totalPaid

    const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setPayLoading(true)
        setError(null)
        const formData = new FormData(e.currentTarget)
        formData.set('invoice_id', invoice.id)
        try {
            const res = await recordPayment(formData)
            if (res.error) { setError(res.error); return }
            setShowPayForm(false)
            router.refresh()
        } catch {
            setError('Failed to record payment.')
        } finally {
            setPayLoading(false)
        }
    }

    const handleDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setDiscountLoading(true)
        setError(null)
        const formData = new FormData(e.currentTarget)
        const discount = parseFloat(formData.get('discount') as string) || 0
        try {
            const res = await applyDiscount(invoice.id, discount)
            if (res.error) { setError(res.error); return }
            setShowDiscountForm(false)
            router.refresh()
        } catch {
            setError('Failed to apply discount.')
        } finally {
            setDiscountLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Invoice Info */}
            <div className="card p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Patient</p>
                        <p className="font-medium text-slate-800">{invoice.patient_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Doctor</p>
                        <p className="text-slate-700">{invoice.doctor_name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Date</p>
                        <p className="text-slate-700">
                            {new Date(invoice.created_at).toLocaleString('en-IN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', hour12: true
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Created By</p>
                        <p className="text-slate-700">{(invoice.profiles as any)?.full_name || '—'}</p>
                    </div>
                </div>
                {invoice.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Notes</p>
                        <p className="text-slate-700 text-sm">{invoice.notes}</p>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-6 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Items</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left px-4 py-2 font-semibold text-slate-600">#</th>
                                <th className="text-left px-4 py-2 font-semibold text-slate-600">Medicine</th>
                                <th className="text-left px-4 py-2 font-semibold text-slate-600">Batch</th>
                                <th className="text-center px-4 py-2 font-semibold text-slate-600">Qty</th>
                                <th className="text-right px-4 py-2 font-semibold text-slate-600">Rate</th>
                                <th className="text-right px-4 py-2 font-semibold text-slate-600">GST</th>
                                <th className="text-right px-4 py-2 font-semibold text-slate-600">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map((item: any, i: number) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                                    <td className="px-4 py-2">
                                        <p className="font-medium text-slate-800">{item.medicine_name}</p>
                                        {item.expiry_date && (
                                            <p className="text-xs text-slate-400">Exp: {item.expiry_date}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-slate-500 text-xs">{item.batch_number || '—'}</td>
                                    <td className="px-4 py-2 text-center text-slate-700">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right text-slate-700">₹{Number(item.unit_price).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right text-slate-500 text-xs">{Number(item.gst_rate)}%</td>
                                    <td className="px-4 py-2 text-right font-medium text-slate-800">₹{Number(item.line_total).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 px-4 sm:px-6 py-4">
                    <div className="flex flex-col items-end gap-1 text-sm">
                        <div className="flex justify-between w-56">
                            <span className="text-slate-500">Subtotal:</span>
                            <span className="text-slate-700">₹{Number(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-56">
                            <span className="text-slate-500">Tax:</span>
                            <span className="text-slate-700">₹{Number(invoice.tax_total).toFixed(2)}</span>
                        </div>
                        {Number(invoice.discount) > 0 && (
                            <div className="flex justify-between w-56">
                                <span className="text-slate-500">Discount:</span>
                                <span className="text-red-600">-₹{Number(invoice.discount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between w-56 pt-2 border-t border-slate-200 font-bold">
                            <span className="text-slate-800">Grand Total:</span>
                            <span className="text-slate-900">₹{Number(invoice.grand_total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Payments</h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                            invoice.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            invoice.payment_status === 'partial' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                        }`}>{invoice.payment_status}</span>
                    </div>
                </div>

                {payments.length > 0 && (
                    <div className="divide-y divide-slate-50">
                        {payments.map((p: any) => (
                            <div key={p.id} className="px-4 sm:px-6 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-800 capitalize">{p.payment_method.replace('_', ' ')}</p>
                                    <p className="text-xs text-slate-400">
                                        {(p.profiles as any)?.full_name || '—'} &middot;{' '}
                                        {new Date(p.created_at).toLocaleString('en-US', {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                        })}
                                        {p.reference_number && ` · Ref: ${p.reference_number}`}
                                    </p>
                                </div>
                                <span className="font-bold text-emerald-600">₹{Number(p.amount).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {invoice.payment_status !== 'paid' && (
                    <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-slate-500">Remaining:</span>
                            <span className="font-bold text-red-600">₹{remaining.toFixed(2)}</span>
                        </div>

                        <div className="flex gap-2">
                            {!showPayForm && (
                                <button onClick={() => { setShowPayForm(true); setShowDiscountForm(false) }} className="btn btn-primary text-sm">
                                    Record Payment
                                </button>
                            )}
                            {!showDiscountForm && Number(invoice.discount) === 0 && (
                                <button onClick={() => { setShowDiscountForm(true); setShowPayForm(false) }} className="btn btn-secondary text-sm">
                                    Apply Discount
                                </button>
                            )}
                        </div>

                        {showPayForm && (
                            <form onSubmit={handlePayment} className="mt-3 space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="label">Amount *</label>
                                        <input name="amount" type="number" step="0.01" min="0.01" max={remaining} defaultValue={remaining.toFixed(2)} required className="input w-full" />
                                    </div>
                                    <div>
                                        <label className="label">Method *</label>
                                        <select name="payment_method" required className="select w-full">
                                            {PAYMENT_METHODS.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Reference #</label>
                                    <input name="reference_number" className="input w-full" placeholder="Transaction ID, cheque number, etc." />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={payLoading} className="btn btn-primary text-sm">
                                        {payLoading && <Loader2 size={14} className="animate-spin mr-1" />} Save Payment
                                    </button>
                                    <button type="button" onClick={() => setShowPayForm(false)} className="btn btn-secondary text-sm">Cancel</button>
                                </div>
                            </form>
                        )}

                        {showDiscountForm && (
                            <form onSubmit={handleDiscount} className="mt-3 space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                                <div>
                                    <label className="label">Discount Amount (₹) *</label>
                                    <input name="discount" type="number" step="0.01" min="0" max={Number(invoice.grand_total)} required className="input w-full sm:w-40" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={discountLoading} className="btn btn-primary text-sm">
                                        {discountLoading && <Loader2 size={14} className="animate-spin mr-1" />} Apply
                                    </button>
                                    <button type="button" onClick={() => setShowDiscountForm(false)} className="btn btn-secondary text-sm">Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
        </div>
    )
}
