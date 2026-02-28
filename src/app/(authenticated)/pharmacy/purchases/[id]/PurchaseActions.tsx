'use client'

import { useState } from 'react'
import { updatePurchaseStatus, recordPurchasePayment } from '../../purchase-actions'

export default function PurchaseActions({ purchase }: { purchase: any }) {
    const [loading, setLoading] = useState('')
    const [error, setError] = useState('')
    const [showPayment, setShowPayment] = useState(false)

    const status = purchase.status
    const remaining = Number(purchase.grand_total) - Number(purchase.amount_paid)

    async function handleStatusChange(newStatus: string) {
        setLoading(newStatus)
        setError('')
        const result = await updatePurchaseStatus(purchase.id, newStatus)
        if (result.error) setError(result.error)
        setLoading('')
    }

    async function handlePayment(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading('payment')
        setError('')
        const formData = new FormData(e.currentTarget)
        formData.set('purchase_id', purchase.id)
        const result = await recordPurchasePayment(formData)
        if (result.error) {
            setError(result.error)
        } else {
            setShowPayment(false)
        }
        setLoading('')
    }

    return (
        <div className="space-y-3">
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">{error}</div>
            )}

            <div className="flex flex-wrap gap-2">
                {status === 'draft' && (
                    <>
                        <button onClick={() => handleStatusChange('ordered')} disabled={!!loading} className="btn btn-primary text-sm">
                            {loading === 'ordered' ? 'Marking...' : 'Mark as Ordered'}
                        </button>
                        <button onClick={() => handleStatusChange('cancelled')} disabled={!!loading} className="btn btn-secondary text-sm text-red-600">
                            {loading === 'cancelled' ? 'Cancelling...' : 'Cancel PO'}
                        </button>
                    </>
                )}

                {status === 'ordered' && (
                    <button onClick={() => handleStatusChange('received')} disabled={!!loading} className="btn btn-primary text-sm">
                        {loading === 'received' ? 'Receiving...' : 'Receive Purchase (Creates Batches & Stock)'}
                    </button>
                )}

                {status === 'partial' && (
                    <button onClick={() => handleStatusChange('received')} disabled={!!loading} className="btn btn-primary text-sm">
                        {loading === 'received' ? 'Receiving...' : 'Receive Remaining'}
                    </button>
                )}

                {purchase.payment_status !== 'paid' && status !== 'cancelled' && (
                    <button onClick={() => setShowPayment(!showPayment)} className="btn btn-outline text-sm">
                        Record Payment
                    </button>
                )}
            </div>

            {showPayment && (
                <form onSubmit={handlePayment} className="card p-4 flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="text-xs font-medium text-slate-500">Amount (₹) *</label>
                        <input name="amount" type="number" step="0.01" min="0.01" max={remaining} required className="input w-40 text-sm" placeholder={`Max: ₹${remaining.toFixed(2)}`} />
                    </div>
                    <button type="submit" disabled={loading === 'payment'} className="btn btn-primary text-sm">
                        {loading === 'payment' ? 'Recording...' : 'Record Payment'}
                    </button>
                    <button type="button" onClick={() => setShowPayment(false)} className="btn btn-ghost text-sm">Cancel</button>
                </form>
            )}
        </div>
    )
}
