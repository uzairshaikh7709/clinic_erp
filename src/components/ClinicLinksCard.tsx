'use client'

import { useState, useCallback } from 'react'
import { Link2, Copy, Check, Globe, LogIn } from 'lucide-react'

function CopyableLink({ label, icon: Icon, path }: { label: string; icon: any; path: string }) {
    const [copied, setCopied] = useState(false)
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url)
        } catch {
            const input = document.createElement('input')
            input.value = url
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [url])

    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Icon size={13} /> {label}
            </p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                <Link2 size={14} className="text-slate-400 flex-shrink-0" />
                <code className="text-sm text-[#0077B6] font-medium truncate flex-1">{url}</code>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all flex-shrink-0
                        bg-white border border-slate-200 hover:border-[#0077B6] hover:text-[#0077B6] text-slate-600"
                >
                    {copied ? <><Check size={13} className="text-emerald-500" /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
            </div>
        </div>
    )
}

export default function ClinicLinksCard({ slug }: { slug: string }) {
    return (
        <div className="card">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <Globe size={18} className="text-slate-400" />
                <h2 className="font-bold text-slate-800">Clinic Portal Links</h2>
            </div>
            <div className="p-5 space-y-4">
                <p className="text-sm text-slate-500">Share these links with clinic staff. The portal page shows the clinic&apos;s own branding — no DrEase mentioned.</p>
                <CopyableLink label="Clinic Portal" icon={Globe} path={`/clinic/${slug}`} />
                <CopyableLink label="Staff Login" icon={LogIn} path={`/clinic/${slug}/login`} />
            </div>
        </div>
    )
}
