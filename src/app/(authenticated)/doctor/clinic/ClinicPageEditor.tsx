'use client'

import { useState, useCallback } from 'react'
import { saveClinicPageData } from './actions'
import {
    Loader2, Plus, X, ExternalLink, CheckCircle,
    Type, FileText, Clock, Stethoscope, ImageIcon, LayoutGrid
} from 'lucide-react'
import type { ClinicPageData } from '@/types/database'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader from '@/components/ImageUploader'

interface Props {
    slug: string
    initialData: ClinicPageData
}

export default function ClinicPageEditor({ slug, initialData }: Props) {
    const [tagline, setTagline] = useState(initialData.tagline || '')
    const [descriptionHtml, setDescriptionHtml] = useState(initialData.description_html || '')
    const [services, setServices] = useState<string[]>(initialData.services || [])
    const [workingHours, setWorkingHours] = useState(initialData.working_hours || '')
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Hero Image */}
            <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <ImageIcon size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">Hero Banner</h3>
                </div>
                <div className="p-5 space-y-4">
                    <ImageUploader
                        currentUrl={heroImageUrl || undefined}
                        onUpload={setHeroImageUrl}
                        onRemove={() => setHeroImageUrl('')}
                        label="Upload Hero Banner"
                        aspectHint="Recommended: 1600x600px"
                    />
                    {heroImageUrl && (
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Image Focus</label>
                            <div className="flex gap-2">
                                {(['top', 'center', 'bottom'] as const).map(pos => (
                                    <button
                                        key={pos}
                                        type="button"
                                        onClick={() => setHeroImagePosition(pos)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                                            heroImagePosition === pos
                                                ? 'bg-[#0077B6] text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tagline */}
            <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <Type size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">Tagline</h3>
                </div>
                <div className="p-5">
                    <input
                        type="text"
                        value={tagline}
                        onChange={e => setTagline(e.target.value)}
                        maxLength={120}
                        className="input"
                        placeholder="e.g. Expert Orthopedic Care You Can Trust"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">{tagline.length}/120 characters — shown in the hero section</p>
                </div>
            </div>

            {/* About / Description with Rich Text */}
            <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">About Your Clinic</h3>
                </div>
                <div className="p-5 space-y-4">
                    <RichTextEditor content={descriptionHtml} onChange={setDescriptionHtml} />

                    <div className="border-t border-slate-100 pt-4">
                        <label className="text-sm font-semibold text-slate-700 mb-3 block">About Section Image</label>
                        <ImageUploader
                            currentUrl={aboutImageUrl || undefined}
                            onUpload={setAboutImageUrl}
                            onRemove={() => setAboutImageUrl('')}
                            label="Upload About Image"
                            aspectHint="Recommended: 800x600px"
                        />
                    </div>

                    {aboutImageUrl && (
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Image Position</label>
                            <div className="flex gap-2">
                                {(['left', 'right'] as const).map(pos => (
                                    <button
                                        key={pos}
                                        type="button"
                                        onClick={() => setAboutImagePosition(pos)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                                            aboutImagePosition === pos
                                                ? 'bg-[#0077B6] text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Services */}
            <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <Stethoscope size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">Services</h3>
                </div>
                <div className="p-5 space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newService}
                            onChange={e => setNewService(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService() } }}
                            className="input flex-1"
                            placeholder="e.g. Joint Replacement Surgery"
                        />
                        <button
                            type="button"
                            onClick={addService}
                            disabled={!newService.trim()}
                            className="btn btn-outline px-3 flex-shrink-0"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {services.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                                >
                                    {service}
                                    <button type="button" onClick={() => removeService(i)} className="text-blue-400 hover:text-red-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">No services added yet.</p>
                    )}
                </div>
            </div>

            {/* Gallery */}
            <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <LayoutGrid size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">Gallery</h3>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {galleryImages.map((url, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200">
                                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-32 object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(i)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {galleryImages.length < 6 && (
                            <ImageUploader
                                onUpload={addGalleryImage}
                                onRemove={() => {}}
                                label="Add Image"
                                aspectHint="Max 6 images"
                            />
                        )}
                    </div>
                    {galleryImages.length === 0 && (
                        <p className="text-sm text-slate-400">Add up to 6 images to showcase your clinic.</p>
                    )}
                </div>
            </div>

            {/* Working Hours */}
            <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <Clock size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">Working Hours</h3>
                </div>
                <div className="p-5">
                    <input
                        type="text"
                        value={workingHours}
                        onChange={e => setWorkingHours(e.target.value)}
                        className="input"
                        placeholder="e.g. Mon-Fri: 9AM - 6PM, Sat: 10AM - 2PM"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
                <a
                    href={`/clinic/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline inline-flex items-center gap-2 text-sm"
                >
                    <ExternalLink size={16} /> Preview Page
                </a>

                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 animate-enter">
                            <CheckCircle size={16} /> Saved!
                        </span>
                    )}
                    {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
                    <button type="submit" disabled={saving} className="btn btn-primary shadow-lg shadow-blue-500/20">
                        {saving ? <><Loader2 className="animate-spin h-4 w-4" /> Saving...</> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
    )
}
