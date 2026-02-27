'use client'

import { useState } from 'react'
import { togglePharmacyEnabled } from './actions'
import { Loader2 } from 'lucide-react'

export default function PharmacyToggle({ orgId, enabled }: { orgId: string; enabled: boolean }) {
    const [isEnabled, setIsEnabled] = useState(enabled)
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        try {
            const result = await togglePharmacyEnabled(orgId, !isEnabled)
            if (result.error) {
                alert(result.error)
                return
            }
            setIsEnabled(!isEnabled)
        } catch {
            alert('Failed to update pharmacy setting')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            aria-label={isEnabled ? 'Disable pharmacy' : 'Enable pharmacy'}
        >
            {loading ? (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin text-white" />
                </span>
            ) : (
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            )}
        </button>
    )
}
