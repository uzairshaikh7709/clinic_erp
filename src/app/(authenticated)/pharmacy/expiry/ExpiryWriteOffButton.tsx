'use client'

import { useState } from 'react'
import { bulkExpiryWriteOff } from '../purchase-actions'
import { Trash2 } from 'lucide-react'

export default function ExpiryWriteOffButton({ expiredCount }: { expiredCount: number }) {
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [result, setResult] = useState<any>(null)

    async function handleWriteOff() {
        setLoading(true)
        const res = await bulkExpiryWriteOff()
        setLoading(false)
        setShowConfirm(false)

        if (res.error) {
            setResult({ error: res.error })
        } else {
            setResult(res)
        }
    }

    if (result && !result.error) {
        return (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                Write-off complete: {result.batchesWrittenOff} batches, {result.totalQuantityRemoved} units removed (₹{result.totalCostValue} cost value)
            </div>
        )
    }

    return (
        <div className="flex flex-col items-end gap-2">
            {result?.error && (
                <div className="p-2 rounded-lg bg-red-50 text-red-700 text-xs">{result.error}</div>
            )}

            {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)} className="btn btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 size={16} className="mr-1.5" /> Write Off Expired ({expiredCount})
                </button>
            ) : (
                <div className="card p-4 space-y-3 border-red-200">
                    <p className="text-sm text-slate-700">
                        This will zero out <strong>{expiredCount} expired batches</strong> and create stock movement records. This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                        <button onClick={handleWriteOff} disabled={loading} className="btn btn-primary text-sm bg-red-600 hover:bg-red-700">
                            {loading ? 'Processing...' : 'Confirm Write-Off'}
                        </button>
                        <button onClick={() => setShowConfirm(false)} className="btn btn-ghost text-sm">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    )
}
