'use client'

import { Edit, Trash2, Loader2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { deletePrescription } from './new/actions'
import { useRouter } from 'next/navigation'

export default function PrescriptionListActions({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const router = useRouter()

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setIsDeleting(true)
        try {
            const result = await deletePrescription(id)
            if (result.error) throw new Error(result.error)
            router.refresh()
        } catch (error: any) {
            alert('Failed to delete: ' + error.message)
            setIsDeleting(false)
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                <span className="text-xs text-red-600 font-semibold">Confirm?</span>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowConfirm(false)
                    }}
                    className="p-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1">
            <Link
                href={`/doctor/prescriptions/${id}/edit`}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Edit"
            >
                <Edit size={16} />
            </Link>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowConfirm(true)
                }}
                className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
        </div>
    )
}
