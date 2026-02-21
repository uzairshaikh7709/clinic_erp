'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteContactSubmission } from './actions'

export default function DeleteContactButton({ id }: { id: string }) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Delete this message?')) return
        setDeleting(true)
        await deleteContactSubmission(id)
        router.refresh()
        setDeleting(false)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 p-1"
            title="Delete"
        >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
    )
}
