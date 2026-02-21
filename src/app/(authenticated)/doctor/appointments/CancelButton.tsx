'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cancelAppointment } from './actions'

export default function CancelButton({ appointmentId }: { appointmentId: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return
        setLoading(true)
        setError(null)
        const res = await cancelAppointment(appointmentId)
        if (res?.error) {
            setError(res.error)
        }
        setLoading(false)
    }

    return (
        <div className="inline-flex items-center gap-2">
            <button
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                title="Cancel Appointment"
            >
                <X size={13} />
                {loading ? '...' : 'Cancel'}
            </button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    )
}
