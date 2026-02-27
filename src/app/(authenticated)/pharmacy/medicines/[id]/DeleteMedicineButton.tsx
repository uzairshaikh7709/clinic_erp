'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMedicine } from '../../actions'
import { Loader2, Trash2 } from 'lucide-react'

export default function DeleteMedicineButton({ medicineId, medicineName, hasStock }: {
    medicineId: string; medicineName: string; hasStock: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (hasStock) {
            alert('Cannot delete medicine with remaining stock. Adjust all batch stock to zero first.')
            return
        }
        if (!confirm(`Are you sure you want to delete "${medicineName}"? This cannot be undone.`)) return

        setLoading(true)
        try {
            const result = await deleteMedicine(medicineId)
            if (result.error) {
                alert(result.error)
                return
            }
            router.push('/pharmacy/medicines')
        } catch {
            alert('Failed to delete medicine.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="btn text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
            {loading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Trash2 size={16} className="mr-1" />}
            Delete
        </button>
    )
}
