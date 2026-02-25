'use client'

import { useState, useRef } from 'react'
import { History } from 'lucide-react'

const MAX_PER_KEY = 30

export function saveSuggestion(key: string, value: string) {
    if (!value.trim()) return
    try {
        const existing = loadSuggestions(key)
        const updated = [value.trim(), ...existing.filter(s => s !== value.trim())].slice(0, MAX_PER_KEY)
        localStorage.setItem(`rx_sug_${key}`, JSON.stringify(updated))
    } catch { }
}

export function loadSuggestions(key: string): string[] {
    try {
        const stored = localStorage.getItem(`rx_sug_${key}`)
        return stored ? JSON.parse(stored) : []
    } catch { return [] }
}

interface Props {
    value: string
    onChange: (val: string) => void
    storageKey: string
    placeholder?: string
    multiline?: boolean
    minHeight?: string
    className?: string
}

export default function SuggestField({ value, onChange, storageKey, placeholder, multiline = true, minHeight, className = '' }: Props) {
    const [open, setOpen] = useState(false)
    const [pool, setPool] = useState<string[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    const openSuggestions = () => {
        const stored = loadSuggestions(storageKey)
        setPool(stored)
        if (stored.length > 0) setOpen(true)
    }

    const filtered = pool
        .filter(s => !value.trim() || s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 6)

    const inputClass = `input w-full ${multiline ? `min-h-[${minHeight || '80px'}]` : ''} ${className}`

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value)
        if (pool.length === 0) {
            const stored = loadSuggestions(storageKey)
            setPool(stored)
        }
        setOpen(true)
    }

    const handleSelect = (s: string) => {
        onChange(s)
        setOpen(false)
    }

    return (
        <div ref={containerRef} className="relative">
            {multiline ? (
                <textarea
                    className={inputClass}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onFocus={openSuggestions}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                />
            ) : (
                <input
                    type="text"
                    className={inputClass}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onFocus={openSuggestions}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                />
            )}

            {open && filtered.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <History size={11} /> Recent
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onMouseDown={() => handleSelect(s)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-[#0077B6] transition-colors border-b border-slate-50 last:border-0 truncate"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
