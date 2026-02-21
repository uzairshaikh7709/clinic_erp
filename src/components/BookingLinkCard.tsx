'use client'

import { useState, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Link2, Copy, Check, Download, QrCode } from 'lucide-react'

interface BookingLinkCardProps {
    slug: string
    orgName: string
}

export default function BookingLinkCard({ slug, orgName }: BookingLinkCardProps) {
    const [copied, setCopied] = useState(false)
    const qrRef = useRef<HTMLDivElement>(null)

    const bookingUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/book-online/${slug}`
        : `/book-online/${slug}`

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(bookingUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input')
            input.value = bookingUrl
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [bookingUrl])

    const handleDownloadQR = useCallback(() => {
        if (!qrRef.current) return
        const svg = qrRef.current.querySelector('svg')
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = 400
            canvas.height = 400
            if (ctx) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, 400, 400)
                ctx.drawImage(img, 0, 0, 400, 400)
            }
            const pngUrl = canvas.toDataURL('image/png')
            const a = document.createElement('a')
            a.href = pngUrl
            a.download = `${orgName.replace(/\s+/g, '-').toLowerCase()}-booking-qr.png`
            a.click()
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }, [orgName])

    return (
        <div className="card animate-enter">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <QrCode size={18} className="text-slate-400" />
                <h2 className="font-bold text-slate-800">Patient Booking Link</h2>
            </div>
            <div className="p-5">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* QR Code */}
                    <div ref={qrRef} className="bg-white p-4 rounded-xl border border-slate-200 flex-shrink-0">
                        <QRCodeSVG
                            value={bookingUrl}
                            size={180}
                            level="M"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#0f172a"
                        />
                    </div>

                    {/* Link & Actions */}
                    <div className="flex-1 space-y-4 min-w-0">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Share this link with patients to book appointments at</p>
                            <p className="font-semibold text-slate-900">{orgName}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 p-3">
                            <Link2 size={16} className="text-slate-400 flex-shrink-0" />
                            <code className="text-sm text-[#0077B6] font-medium truncate flex-1">{bookingUrl}</code>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex-shrink-0
                                    bg-white border border-slate-200 hover:border-[#0077B6] hover:text-[#0077B6] text-slate-600"
                            >
                                {copied ? <><Check size={14} className="text-emerald-500" /> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>

                        <button
                            onClick={handleDownloadQR}
                            className="btn btn-outline inline-flex items-center gap-2 text-sm"
                        >
                            <Download size={16} /> Download QR Code
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
