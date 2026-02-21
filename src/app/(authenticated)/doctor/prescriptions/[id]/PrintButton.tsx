'use client'

import { useState, useEffect } from 'react'
import { Printer, Minus, Plus } from 'lucide-react'

const STORAGE_KEY = 'rx-header-margin'
const DEFAULT_MARGIN = 120

export default function PrintControls({ onMarginChange }: { onMarginChange?: (px: number) => void }) {
    const [margin, setMargin] = useState(DEFAULT_MARGIN)

    useEffect(() => {
        if (!onMarginChange) return
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const val = Number(saved)
            setMargin(val)
            onMarginChange(val)
        }
    }, [onMarginChange])

    const update = (val: number) => {
        const clamped = Math.max(0, Math.min(400, val))
        setMargin(clamped)
        localStorage.setItem(STORAGE_KEY, String(clamped))
        onMarginChange?.(clamped)
    }

    // Simple mode: just a print button (for patient portal)
    if (!onMarginChange) {
        return (
            <button
                onClick={() => window.print()}
                className="btn btn-primary shadow-lg shadow-blue-500/20"
            >
                <Printer size={18} className="mr-2" /> Print Prescription
            </button>
        )
    }

    return (
        <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Header Margin:</span>
                <button onClick={() => update(margin - 10)} className="btn btn-sm btn-ghost p-1"><Minus size={16} /></button>
                <input
                    type="number"
                    value={margin}
                    onChange={e => update(Number(e.target.value))}
                    className="input w-20 h-8 text-center text-sm"
                />
                <span className="text-xs text-slate-400">px</span>
                <button onClick={() => update(margin + 10)} className="btn btn-sm btn-ghost p-1"><Plus size={16} /></button>
            </div>
            <button
                onClick={() => window.print()}
                className="btn btn-primary shadow-lg shadow-blue-500/20"
            >
                <Printer size={18} className="mr-2" /> Print Prescription
            </button>
        </div>
    )
}
