'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="btn btn-primary shadow-lg shadow-blue-500/20"
        >
            <Printer size={18} className="mr-2" /> Print Prescription
        </button>
    )
}
