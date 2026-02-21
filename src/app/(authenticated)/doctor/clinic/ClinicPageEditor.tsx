'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { saveClinicPageData } from './actions'
import {
    Loader2, Plus, X, ExternalLink, CheckCircle, Pencil,
    Calendar, Phone, MapPin, Mail, Clock, CheckCircle as Check,
    Stethoscope, Star, Shield, ArrowRight, Building2
} from 'lucide-react'
import type { ClinicPageData } from '@/types/database'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader from '@/components/ImageUploader'
import { sanitizeHtml } from '@/utils/sanitize-html'

interface Props {
    slug: string
    initialData: ClinicPageData
    orgName: string
    orgAddress: string
    orgPhone: string
    orgEmail: string
    logoUrl: string
    doctorCount: number
}

function EditOverlay({ label, preview, editor, className = '' }: {
    label: string
    preview: React.ReactNode
    editor: React.ReactNode
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open && editorRef.current) {
            editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [open])

    return (
        <div className={`group/edit relative ${className}`}>
            {/* Edit badge */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`absolute top-2 right-2 z-20 transition-all rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg flex items-center gap-1 ${open
                    ? 'opacity-100 bg-blue-600 text-white border border-blue-600'
                    : 'opacity-0 group-hover/edit:opacity-100 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
                    }`}
            >
                <Pencil size={11} /> {label}
            </button>
            {/* Hover ring */}
            {!open && <div className="absolute inset-0 ring-0 group-hover/edit:ring-2 ring-blue-400/40 pointer-events-none transition-all z-10" />}
            {/* Preview - always visible */}
            {preview}
            {/* Inline editor panel - only when open */}
            {open && (
                <div ref={editorRef} className="border-t-2 border-blue-500 bg-white p-5 space-y-3 animate-enter" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Pencil size={11} /> {label}</span>
                        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-medium"><X size={14} /> Close</button>
                    </div>
                    {editor}
                </div>
            )}
        </div>
    )
}

export default function ClinicPageEditor({ slug, initialData, orgName, orgAddress, orgPhone, orgEmail, logoUrl, doctorCount }: Props) {
    const [tagline, setTagline] = useState(initialData.tagline || '')
    const [descriptionHtml, setDescriptionHtml] = useState(initialData.description_html || '')
    const [services, setServices] = useState<string[]>(initialData.services || [])
    const [workingHours, setWorkingHours] = useState(initialData.working_hours || '')
    const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl)
    const [heroImageUrl, setHeroImageUrl] = useState(initialData.hero_image_url || '')
    const [heroImagePosition, setHeroImagePosition] = useState<'top' | 'center' | 'bottom'>(initialData.hero_image_position || 'center')
    const [aboutImageUrl, setAboutImageUrl] = useState(initialData.about_image_url || '')
    const [aboutImagePosition, setAboutImagePosition] = useState<'left' | 'right'>(initialData.about_image_position || 'left')
    const [galleryImages, setGalleryImages] = useState<string[]>(initialData.gallery_images || [])
    const [newService, setNewService] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addService = useCallback(() => {
        const trimmed = newService.trim()
        if (trimmed && !services.includes(trimmed)) {
            setServices(prev => [...prev, trimmed])
            setNewService('')
        }
    }, [newService, services])

    const removeService = useCallback((index: number) => {
        setServices(prev => prev.filter((_, i) => i !== index))
    }, [])

    const addGalleryImage = useCallback((url: string) => {
        setGalleryImages(prev => [...prev, url])
    }, [])

    const removeGalleryImage = useCallback((index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSaved(false)

        const formData = new FormData()
        formData.append('logo_url', currentLogoUrl)
        formData.append('tagline', tagline)
        formData.append('description_html', descriptionHtml)
        formData.append('services', JSON.stringify(services))
        formData.append('working_hours', workingHours)
        formData.append('hero_image_url', heroImageUrl)
        formData.append('hero_image_position', heroImagePosition)
        formData.append('about_image_url', aboutImageUrl)
        formData.append('about_image_position', aboutImagePosition)
        formData.append('gallery_images', JSON.stringify(galleryImages))

        const result = await saveClinicPageData(formData)
        setSaving(false)

        if (result.error) {
            setError(result.error)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
    }

    const hasDescription = !!descriptionHtml && descriptionHtml.replace(/<[^>]*>/g, '').trim().length > 0
    const serviceCount = services.length
    const gradients = [
        'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-violet-500 to-purple-500',
        'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-sky-500 to-indigo-500',
    ]

    return (
        <form onSubmit={handleSubmit}>
            {/* Sticky Save Bar */}
            <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl p-3 mb-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">Clinic Page Editor</span>
                    <span className="text-xs text-slate-400">Hover any section to edit</span>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 animate-enter">
                            <CheckCircle size={16} /> Saved!
                        </span>
                    )}
                    {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
                    <a href={`/clinic/${slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary flex items-center gap-1.5">
                        <ExternalLink size={14} /> Preview
                    </a>
                    <button type="submit" disabled={saving} className="btn btn-sm btn-primary shadow-lg shadow-blue-500/20">
                        {saving ? <><Loader2 className="animate-spin h-4 w-4 mr-1" /> Saving...</> : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* ===== LIVE PREVIEW ===== */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-[#fafbfc]">

                {/* ───── Hero ───── */}
                <EditOverlay
                    label="Edit Hero"
                    className="relative"
                    preview={
                        <section className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                            <div className="absolute inset-0 opacity-30" style={{
                                background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.5), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(16,185,129,0.3), transparent)'
                            }} />
                            <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                                    <div className="max-w-xl">
                                        {currentLogoUrl && (
                                            <div className="mb-5 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                                <img src={currentLogoUrl} alt={orgName} className="w-7 h-7 rounded-lg object-cover" />
                                                <span className="text-sm font-medium text-white/80">Welcome to {orgName}</span>
                                            </div>
                                        )}
                                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                                            Your Health,{' '}
                                            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Our Priority</span>
                                        </h1>
                                        {tagline ? (
                                            <p className="text-lg text-slate-300 mt-4 leading-relaxed">{tagline}</p>
                                        ) : (
                                            <p className="text-lg text-slate-500 mt-4 italic">Add a tagline...</p>
                                        )}
                                        <div className="flex gap-3 mt-6">
                                            <span className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white text-slate-900 font-bold text-sm">
                                                <Calendar size={16} /> Book Appointment
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 lg:w-[300px] flex-shrink-0">
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                                            <Stethoscope size={18} className="text-blue-400 mb-2" />
                                            <p className="text-xl font-bold text-white">{doctorCount}</p>
                                            <p className="text-xs text-slate-400">Doctors</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                                            <Check size={18} className="text-emerald-400 mb-2" />
                                            <p className="text-xl font-bold text-white">{serviceCount || '10'}+</p>
                                            <p className="text-xs text-slate-400">Services</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                                            <Star size={18} className="text-amber-400 mb-2" />
                                            <p className="text-xl font-bold text-white">4.9</p>
                                            <p className="text-xs text-slate-400">Rating</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                                            <Shield size={18} className="text-purple-400 mb-2" />
                                            <p className="text-xl font-bold text-white">24/7</p>
                                            <p className="text-xs text-slate-400">Support</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    }
                    editor={
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Clinic Logo</label>
                                <ImageUploader currentUrl={currentLogoUrl || undefined} onUpload={setCurrentLogoUrl} onRemove={() => setCurrentLogoUrl('')} label="Upload Logo" aspectHint="Square, 200x200px" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tagline</label>
                                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} maxLength={120} className="input w-full" placeholder="e.g. Expert Orthopedic Care You Can Trust" />
                                <p className="text-xs text-slate-400 mt-1">{tagline.length}/120 characters</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Hero Banner Image</label>
                                <ImageUploader currentUrl={heroImageUrl || undefined} onUpload={setHeroImageUrl} onRemove={() => setHeroImageUrl('')} label="Upload Hero Banner" aspectHint="1600x600px" />
                            </div>
                            {heroImageUrl && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Image Focus</label>
                                    <div className="flex gap-2">
                                        {(['top', 'center', 'bottom'] as const).map(pos => (
                                            <button key={pos} type="button" onClick={() => setHeroImagePosition(pos)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${heroImagePosition === pos ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{pos}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />

                {/* ───── Quick Info Bar ───── */}
                <div className="bg-white border-b border-slate-200/60 px-6 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        {orgAddress && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {orgAddress}</span>}
                        {orgPhone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {orgPhone}</span>}
                        {orgEmail && <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> {orgEmail}</span>}
                        {workingHours && <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {workingHours.split('\n')[0]}</span>}
                    </div>
                </div>

                {/* ───── About ───── */}
                <EditOverlay
                    label="Edit About"
                    className="py-12 px-6"
                    preview={
                        <>
                            <div className="text-center mb-8">
                                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">About Us</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">About Our Clinic</h2>
                            </div>
                            {hasDescription ? (
                                aboutImageUrl ? (
                                    <div className={`flex flex-col md:flex-row gap-8 items-center ${aboutImagePosition === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="clinic-content prose prose-slate max-w-none prose-p:text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(descriptionHtml) }} />
                                        </div>
                                        <div className="w-full md:w-[40%] flex-shrink-0">
                                            <img src={aboutImageUrl} alt="About" className="w-full rounded-2xl shadow-lg object-cover max-h-[300px]" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/60 p-8">
                                        <div className="clinic-content prose prose-slate max-w-none prose-p:text-slate-600 text-center" dangerouslySetInnerHTML={{ __html: sanitizeHtml(descriptionHtml) }} />
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-slate-400 italic">No description added yet. Click edit to add one.</div>
                            )}
                        </>
                    }
                    editor={
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
                                <RichTextEditor content={descriptionHtml} onChange={setDescriptionHtml} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">About Image</label>
                                <ImageUploader currentUrl={aboutImageUrl || undefined} onUpload={setAboutImageUrl} onRemove={() => setAboutImageUrl('')} label="Upload About Image" aspectHint="800x600px" />
                            </div>
                            {aboutImageUrl && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Image Position</label>
                                    <div className="flex gap-2">
                                        {(['left', 'right'] as const).map(pos => (
                                            <button key={pos} type="button" onClick={() => setAboutImagePosition(pos)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${aboutImagePosition === pos ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{pos}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />

                {/* ───── Services ───── */}
                <EditOverlay
                    label="Edit Services"
                    className="py-12 px-6 bg-white"
                    preview={
                        <>
                            <div className="text-center mb-8">
                                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">What We Offer</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Services</h2>
                            </div>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
                                    {services.map((service, i) => (
                                        <div key={i} className="group/svc flex items-center gap-3 p-4 rounded-2xl bg-[#fafbfc] border border-slate-200/60">
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <Check size={16} className="text-white" />
                                            </div>
                                            <span className="font-semibold text-slate-800 flex-1">{service}</span>
                                            <button type="button" onClick={() => removeService(i)} className="opacity-0 group-hover/svc:opacity-100 text-slate-400 hover:text-red-500 transition-all"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 italic">No services added. Click edit to add services.</div>
                            )}
                        </>
                    }
                    editor={
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input type="text" value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService() } }} className="input flex-1" placeholder="e.g. Joint Replacement Surgery" />
                                <button type="button" onClick={addService} disabled={!newService.trim()} className="btn btn-primary px-3"><Plus size={16} /></button>
                            </div>
                            {services.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {services.map((s, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                                            {s}
                                            <button type="button" onClick={() => removeService(i)} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    }
                />

                {/* ───── Gallery ───── */}
                <EditOverlay
                    label="Edit Gallery"
                    className="py-12 px-6"
                    preview={
                        <>
                            <div className="text-center mb-8">
                                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-2">Gallery</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Clinic</h2>
                            </div>
                            {galleryImages.length > 0 ? (
                                <div className={`grid gap-3 ${galleryImages.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : galleryImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                                    {galleryImages.map((url, i) => (
                                        <div key={i} className="group/gal relative rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-100">
                                            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-52 object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover/gal:bg-black/40 transition-colors flex items-center justify-center">
                                                <button type="button" onClick={() => removeGalleryImage(i)} className="opacity-0 group-hover/gal:opacity-100 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-opacity">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 italic">No gallery images. Click edit to add photos.</div>
                            )}
                        </>
                    }
                    editor={
                        <div>
                            {galleryImages.length < 6 ? (
                                <ImageUploader onUpload={addGalleryImage} onRemove={() => {}} label="Add Gallery Image" aspectHint={`${6 - galleryImages.length} slots remaining`} />
                            ) : (
                                <p className="text-sm text-amber-600 font-medium">Maximum 6 images reached. Remove one to add more.</p>
                            )}
                        </div>
                    }
                />

                {/* ───── Working Hours + Contact ───── */}
                <EditOverlay
                    label="Edit Hours"
                    className="py-12 px-6 bg-white"
                    preview={
                        <div className="bg-[#fafbfc] rounded-2xl border border-slate-200/60 overflow-hidden max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className="p-8 lg:border-r border-slate-200/60">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><Clock size={18} className="text-amber-600" /></div>
                                        <h3 className="text-lg font-bold text-slate-900">Working Hours</h3>
                                    </div>
                                    {workingHours ? (
                                        <div className="space-y-2.5">
                                            {workingHours.split('\n').filter(Boolean).map((line, i) => (
                                                <div key={i} className="py-2 border-b border-dashed border-slate-200 last:border-0 text-slate-700">{line}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic">No working hours set</p>
                                    )}
                                </div>
                                <div className="p-8 bg-white/50">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><Phone size={18} className="text-blue-600" /></div>
                                        <h3 className="text-lg font-bold text-slate-900">Get in Touch</h3>
                                    </div>
                                    <div className="space-y-4 text-sm text-slate-600">
                                        {orgAddress && <div className="flex items-start gap-3"><MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" /><span>{orgAddress}</span></div>}
                                        {orgPhone && <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400 flex-shrink-0" /><span>{orgPhone}</span></div>}
                                        {orgEmail && <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400 flex-shrink-0" /><span>{orgEmail}</span></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    editor={
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Working Hours</label>
                            <textarea
                                value={workingHours}
                                onChange={e => setWorkingHours(e.target.value)}
                                className="input w-full min-h-[100px]"
                                placeholder={"Mon-Fri: 9AM - 6PM\nSat: 10AM - 2PM\nSun: Closed"}
                            />
                            <p className="text-xs text-slate-400 mt-1">Each line appears as a separate row. Edit address/phone/email in the Clinic Details section above.</p>
                        </div>
                    }
                />

                {/* ───── CTA Preview ───── */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900" />
                    <div className="absolute inset-0 opacity-30" style={{
                        background: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(59,130,246,0.5), transparent)'
                    }} />
                    <div className="relative max-w-3xl mx-auto px-6 py-16 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to Book Your Visit?</h2>
                        <p className="text-slate-400 mt-3">Schedule your appointment online in just a few clicks.</p>
                        <span className="inline-flex items-center gap-2 h-11 px-6 mt-6 rounded-full bg-white text-slate-900 font-bold text-sm">
                            Book Appointment <ArrowRight size={16} />
                        </span>
                    </div>
                </section>

                {/* ───── Footer Preview ───── */}
                <footer className="bg-slate-950 text-slate-500 px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"><Building2 size={12} className="text-white/50" /></div>
                            <span className="text-slate-400">{orgName}</span>
                        </div>
                        <p>&copy; {new Date().getFullYear()} {orgName}. All rights reserved.</p>
                    </div>
                </footer>

            </div>
        </form>
    )
}
