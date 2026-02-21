import { createAdminClient } from '@/utils/supabase/admin'
import { sanitizeHtml } from '@/utils/sanitize-html'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Calendar, LogIn, MapPin, Phone, Mail, CheckCircle, Clock, ArrowRight, Star, Users, Stethoscope, Shield } from 'lucide-react'
import type { Metadata } from 'next'
import type { ClinicPageData } from '@/types/database'

export const dynamic = 'force-dynamic'

async function getClinicData(slug: string) {
    const admin = createAdminClient()

    const { data: org } = await admin
        .from('organizations')
        .select('id, name, slug, address, phone, email, logo_url, page_data')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!org) return null

    const { data: doctors } = await admin
        .from('doctors')
        .select('id, specialization, registration_number, profile_id, profiles!inner(full_name, email)')
        .eq('clinic_id', org.id)
        .eq('is_active', true)

    return { org, doctors: doctors || [] }
}

function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, '').trim()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const data = await getClinicData(slug)

    if (!data) return { title: 'Clinic Not Found' }

    const { org } = data
    const pageData = (org.page_data || {}) as ClinicPageData
    const plainDesc = pageData.description_html ? stripHtml(pageData.description_html) : ''
    const description = plainDesc || `Book an appointment at ${org.name}. Professional healthcare services.`

    return {
        title: `${org.name} — ${pageData.tagline || 'Book an Appointment'}`,
        description,
        openGraph: {
            title: org.name,
            description,
            type: 'website',
            ...(pageData.hero_image_url ? { images: [{ url: pageData.hero_image_url }] }
                : org.logo_url ? { images: [{ url: org.logo_url }] } : {}),
        },
    }
}

export default async function ClinicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const data = await getClinicData(slug)

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
                <Building2 size={48} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Clinic Not Found</h1>
                <p className="text-slate-500 mb-6">This clinic page is unavailable or inactive.</p>
                <Link href="/" className="btn btn-primary">Go Home</Link>
            </div>
        )
    }

    const { org, doctors } = data
    const pd = (org.page_data || {}) as ClinicPageData
    const hasAboutImage = !!pd.about_image_url
    const hasDescription = !!pd.description_html && stripHtml(pd.description_html).length > 0

    // JSON-LD
    const plainDesc = pd.description_html ? stripHtml(pd.description_html) : undefined
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'MedicalOrganization',
        name: org.name,
        ...(plainDesc && { description: plainDesc }),
        ...(org.address && { address: { '@type': 'PostalAddress', streetAddress: org.address } }),
        ...(org.phone && { telephone: org.phone }),
        ...(org.email && { email: org.email }),
        ...(org.logo_url && { logo: org.logo_url }),
        ...(pd.working_hours && { openingHours: pd.working_hours }),
    }

    const serviceCount = pd.services?.length || 0
    const contactItems = [org.address, org.phone, org.email].filter(Boolean)

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ───── Header ───── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {org.logo_url ? (
                            <Image src={org.logo_url} alt={org.name} width={36} height={36} className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                                <Building2 size={18} className="text-white" />
                            </div>
                        )}
                        <span className="font-bold text-lg tracking-tight text-slate-900">{org.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={`/clinic/${slug}/login`}
                            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 px-3 py-1.5"
                        >
                            <LogIn size={15} /> Staff
                        </Link>
                        <Link
                            href={`/book-online/${slug}`}
                            className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                        >
                            <Calendar size={14} /> <span className="hidden sm:inline">Book Now</span><span className="sm:hidden">Book</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ───── Hero ───── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                {/* Mesh gradient overlay */}
                <div className="absolute inset-0 opacity-30" style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.5), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(16,185,129,0.3), transparent)'
                }} />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0H0v60' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16">
                        {/* Left: Text */}
                        <div className="max-w-xl lg:max-w-2xl">
                            {org.logo_url && (
                                <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                    <Image src={org.logo_url} alt={org.name} width={28} height={28} className="w-7 h-7 rounded-lg object-cover" />
                                    <span className="text-sm font-medium text-white/80">Welcome to {org.name}</span>
                                </div>
                            )}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                                Your Health,{' '}
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                                    Our Priority
                                </span>
                            </h1>
                            {pd.tagline && (
                                <p className="text-lg md:text-xl text-slate-300 mt-5 leading-relaxed max-w-lg">{pd.tagline}</p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <Link
                                    href={`/book-online/${slug}`}
                                    className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-white text-slate-900 font-bold text-base hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
                                >
                                    <Calendar size={18} /> Book Appointment
                                </Link>
                                {org.phone && (
                                    <a
                                        href={`tel:${org.phone}`}
                                        className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full border border-white/20 text-white font-semibold text-base hover:bg-white/10 backdrop-blur-sm transition-all"
                                    >
                                        <Phone size={18} /> Call Us
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Right: Stats cards */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[360px] flex-shrink-0">
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                                    <Stethoscope size={20} className="text-blue-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">{doctors.length}</p>
                                <p className="text-sm text-slate-400 mt-0.5">Doctor{doctors.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                                    <CheckCircle size={20} className="text-emerald-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">{serviceCount || '10'}+</p>
                                <p className="text-sm text-slate-400 mt-0.5">Services</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
                                    <Star size={20} className="text-amber-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">4.9</p>
                                <p className="text-sm text-slate-400 mt-0.5">Rating</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                                    <Shield size={20} className="text-purple-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">24/7</p>
                                <p className="text-sm text-slate-400 mt-0.5">Support</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ───── Quick Info Bar ───── */}
            {contactItems.length > 0 && (
                <div className="bg-white border-b border-slate-200/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
                            {org.address && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <MapPin size={15} className="text-slate-400 flex-shrink-0" />
                                    <span>{org.address}</span>
                                </div>
                            )}
                            {org.phone && (
                                <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
                                    <Phone size={15} className="text-slate-400 flex-shrink-0" />
                                    <span>{org.phone}</span>
                                </a>
                            )}
                            {org.email && (
                                <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
                                    <Mail size={15} className="text-slate-400 flex-shrink-0" />
                                    <span>{org.email}</span>
                                </a>
                            )}
                            {pd.working_hours && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock size={15} className="text-slate-400 flex-shrink-0" />
                                    <span>{pd.working_hours.split('\n')[0]}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ───── About ───── */}
            {hasDescription && (
                <section className="py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">About Us</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">About Our Clinic</h2>
                        </div>

                        {hasAboutImage ? (
                            <div className={`flex flex-col md:flex-row gap-10 lg:gap-16 items-center ${pd.about_image_position === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="clinic-content prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-800 prose-ul:text-slate-600 prose-ol:text-slate-600"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(pd.description_html!) }}
                                    />
                                </div>
                                <div className="w-full md:w-[45%] flex-shrink-0">
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-3xl opacity-50 blur-sm" />
                                        <Image
                                            src={pd.about_image_url!}
                                            alt={`About ${org.name}`}
                                            width={600}
                                            height={400}
                                            className="relative w-full rounded-2xl shadow-xl object-cover max-h-[420px]"
                                            sizes="(max-width: 768px) 100vw, 45vw"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/60 p-8 md:p-12 shadow-sm">
                                <div
                                    className="clinic-content prose prose-lg prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-800 text-center"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(pd.description_html!) }}
                                />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ───── Services ───── */}
            {pd.services && pd.services.length > 0 && (
                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">What We Offer</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Our Services</h2>
                            <p className="text-slate-500 mt-3 max-w-lg mx-auto">Comprehensive healthcare tailored to your needs</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pd.services.map((service, i) => {
                                const gradients = [
                                    'from-blue-500 to-cyan-500',
                                    'from-emerald-500 to-teal-500',
                                    'from-violet-500 to-purple-500',
                                    'from-amber-500 to-orange-500',
                                    'from-rose-500 to-pink-500',
                                    'from-sky-500 to-indigo-500',
                                ]
                                const g = gradients[i % gradients.length]
                                return (
                                    <div
                                        key={i}
                                        className="group flex items-center gap-4 p-5 rounded-2xl bg-[#fafbfc] border border-slate-200/60 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                            <CheckCircle size={18} className="text-white" />
                                        </div>
                                        <span className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">{service}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Gallery ───── */}
            {pd.gallery_images && pd.gallery_images.length > 0 && (
                <section className="py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-2">Gallery</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Our Clinic</h2>
                        </div>
                        <div className={`grid gap-4 ${
                            pd.gallery_images.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto'
                            : pd.gallery_images.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}>
                            {pd.gallery_images.map((url, i) => (
                                <div key={i} className="group rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                    <Image
                                        src={url}
                                        alt={`${org.name} gallery ${i + 1}`}
                                        width={400}
                                        height={280}
                                        className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Doctors ───── */}
            {doctors.length > 0 && (
                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Our Team</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Meet Our Doctors</h2>
                            <p className="text-slate-500 mt-3 max-w-lg mx-auto">Experienced professionals dedicated to your health</p>
                        </div>
                        <div className={`grid gap-6 ${
                            doctors.length === 1 ? 'grid-cols-1 max-w-sm mx-auto'
                            : doctors.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}>
                            {doctors.map((doc: any) => {
                                const name = doc.profiles?.full_name || 'Doctor'
                                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                return (
                                    <div key={doc.id} className="group relative bg-[#fafbfc] rounded-2xl border border-slate-200/60 p-8 text-center hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 overflow-hidden">
                                        {/* Subtle gradient top border */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                            <span className="text-white font-bold text-xl">{initials}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900">Dr. {name}</h3>
                                        {doc.specialization && (
                                            <p className="text-sm text-blue-600 font-medium mt-1.5">{doc.specialization}</p>
                                        )}
                                        {doc.registration_number && (
                                            <p className="text-xs text-slate-400 mt-1.5">Reg: {doc.registration_number}</p>
                                        )}
                                        <Link
                                            href={`/book-online/${slug}`}
                                            className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                                        >
                                            Book Appointment <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Working Hours + Contact Combined ───── */}
            {(pd.working_hours || contactItems.length > 0) && (
                <section className="py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                {/* Working Hours */}
                                {pd.working_hours && (
                                    <div className="p-8 md:p-12 lg:border-r border-slate-200/60">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                <Clock size={20} className="text-amber-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">Working Hours</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {pd.working_hours.split('\n').filter(Boolean).map((line, i) => (
                                                <div key={i} className="flex items-center justify-between py-2.5 border-b border-dashed border-slate-100 last:border-0">
                                                    <span className="text-slate-700">{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Contact Info */}
                                {contactItems.length > 0 && (
                                    <div className="p-8 md:p-12 bg-slate-50/50">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Phone size={20} className="text-blue-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">Get in Touch</h3>
                                        </div>
                                        <div className="space-y-5">
                                            {org.address && (
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <MapPin size={18} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                                                        <p className="text-slate-700">{org.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {org.phone && (
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Phone size={18} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                                        <a href={`tel:${org.phone}`} className="text-slate-700 hover:text-blue-600 transition-colors font-medium">{org.phone}</a>
                                                    </div>
                                                </div>
                                            )}
                                            {org.email && (
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Mail size={18} className="text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                                        <a href={`mailto:${org.email}`} className="text-slate-700 hover:text-blue-600 transition-colors font-medium">{org.email}</a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Final CTA ───── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900" />
                <div className="absolute inset-0 opacity-30" style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(59,130,246,0.5), transparent), radial-gradient(ellipse 60% 40% at 20% 50%, rgba(16,185,129,0.3), transparent)'
                }} />

                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Book Your Visit?</h2>
                    <p className="text-slate-400 mt-4 text-lg max-w-md mx-auto">Schedule your appointment online in just a few clicks. No waiting, no hassle.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                        <Link
                            href={`/book-online/${slug}`}
                            className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-white text-slate-900 font-bold text-base hover:bg-slate-100 transition-all shadow-lg"
                        >
                            Book Appointment <ArrowRight size={18} />
                        </Link>
                        {org.phone && (
                            <a
                                href={`tel:${org.phone}`}
                                className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full border border-white/20 text-white font-semibold text-base hover:bg-white/10 transition-all"
                            >
                                <Phone size={18} /> {org.phone}
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ───── Footer ───── */}
            <footer className="bg-slate-950 text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {org.logo_url ? (
                                <Image src={org.logo_url} alt={org.name} width={28} height={28} className="w-7 h-7 rounded-lg object-cover opacity-70" />
                            ) : (
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Building2 size={14} className="text-white/50" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-400">{org.name}</span>
                        </div>
                        <p className="text-sm">&copy; {new Date().getFullYear()} {org.name}. All rights reserved.</p>
                        <div className="flex items-center gap-4 text-sm">
                            <Link href={`/book-online/${slug}`} className="hover:text-white transition-colors">Book Online</Link>
                            <Link href={`/clinic/${slug}/login`} className="hover:text-white transition-colors">Staff Portal</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
