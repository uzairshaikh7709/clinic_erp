'use client'

import { useState } from 'react'
import { saveSignature } from './actions'
import { Loader2, CheckCircle, PenLine } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'

export default function SignatureEditor({ currentUrl }: { currentUrl: string }) {
    const [signatureUrl, setSignatureUrl] = useState(currentUrl)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSaved(false)

        const formData = new FormData()
        formData.append('signature_url', signatureUrl)

        const result = await saveSignature(formData)
        setSaving(false)

        if (result.error) {
            setError(result.error)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
    }

    return (
        <div className="card">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                <PenLine size={18} className="text-slate-400" />
                <h2 className="font-bold text-slate-800">Signature</h2>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
                <p className="text-sm text-slate-500">Upload your signature image. It will appear on prescriptions and certificates.</p>

                {signatureUrl && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex justify-center">
                        <img src={signatureUrl} alt="Signature" className="max-h-24 object-contain" />
                    </div>
                )}

                <ImageUploader
                    currentUrl={signatureUrl || undefined}
                    onUpload={setSignatureUrl}
                    onRemove={() => setSignatureUrl('')}
                    label="Upload Signature"
                    aspectHint="PNG with transparent background, ~400x150px"
                />

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary w-full sm:w-auto"
                    >
                        {saving ? <><Loader2 className="animate-spin h-4 w-4 mr-1" /> Saving...</> : 'Save Signature'}
                    </button>
                    {saved && (
                        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 animate-enter">
                            <CheckCircle size={16} /> Saved!
                        </span>
                    )}
                    {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
                </div>
            </div>
        </div>
    )
}
