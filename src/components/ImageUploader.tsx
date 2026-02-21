'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { uploadClinicImage, deleteClinicImage } from '@/app/(authenticated)/doctor/clinic/actions'

interface ImageUploaderProps {
    currentUrl?: string
    onUpload: (url: string) => void
    onRemove: () => void
    label: string
    aspectHint?: string
}

export default function ImageUploader({ currentUrl, onUpload, onRemove, label, aspectHint }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (file: File) => {
        setError(null)
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadClinicImage(formData)
        setUploading(false)

        if (result.error) {
            setError(result.error)
        } else if (result.url) {
            onUpload(result.url)
        }
    }, [onUpload])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) handleFile(file)
    }, [handleFile])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        if (inputRef.current) inputRef.current.value = ''
    }, [handleFile])

    const handleRemove = useCallback(async () => {
        if (!currentUrl) return
        const formData = new FormData()
        formData.append('url', currentUrl)
        await deleteClinicImage(formData)
        onRemove()
    }, [currentUrl, onRemove])

    if (currentUrl) {
        return (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                    src={currentUrl}
                    alt={label}
                    className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                        ? 'border-[#0077B6] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 size={28} className="text-[#0077B6] animate-spin" />
                        <p className="text-sm text-slate-500">Uploading...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                            <ImageIcon size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">{label}</p>
                        <p className="text-xs text-slate-400">
                            Drag & drop or click to browse
                            {aspectHint && <> &middot; {aspectHint}</>}
                        </p>
                        <p className="text-xs text-slate-400">JPEG, PNG, WebP &middot; Max 5MB</p>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                />
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
    )
}
