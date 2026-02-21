import { createAdminClient } from '@/utils/supabase/admin'
import { sanitizeHtml } from '@/utils/sanitize-html'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Calendar, LogIn, MapPin, Phone, Mail, CheckCircle, Clock, ArrowRight } from 'lucide-react'
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

    return (
        <div className="min-h-screen bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ───── Header ───── */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {org.logo_url ? (
                            <Image src={org.logo_url} alt={org.name} width={36} height={36} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#0077B6] flex items-center justify-center shadow-sm">
                                <Building2 size={18} className="text-white" />
                            </div>
                        )}
                        <span className="font-bold text-lg tracking-tight text-slate-900">{org.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/book-online/${slug}`}
                            className="hidden sm:inline-flex btn btn-primary text-sm h-9 px-4 shadow-md shadow-blue-500/15"
                        >
                            Book Now
                        </Link>
                        <Link
                            href={`/clinic/${slug}/login`}
                            className="text-sm font-semibold text-slate-500 hover:text-[#0077B6] transition-colors flex items-center gap-1.5"
                        >
                            <LogIn size={15} /> Staff
                        </Link>
                    </div>
                </div>
            </header>

            {/* ───── Hero ───── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0077B6] via-[#023e8a] to-[#0096c7] text-white">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-28 lg:py-36">
                    <div className="max-w-2xl">
                        {org.logo_url && (
                            <Image src={org.logo_url} alt={org.name} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover shadow-xl mb-6 border-2 border-white/20" />
                        )}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                            {org.name}
                        </h1>
                        {pd.tagline && (
                            <p className="text-lg md:text-xl text-blue-100 mt-3 leading-relaxed">{pd.tagline}</p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <Link
                                href={`/book-online/${slug}`}
                                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0077B6] font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                            >
                                <Calendar size={18} /> Book Appointment
                            </Link>
                            {org.phone && (
                                <a
                                    href={`tel:${org.phone}`}
                                    className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all"
                                >
                                    <Phone size={18} /> Call Us
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ───── About ───── */}
            {hasDescription && (
                <section className="py-16 md:py-20 bg-slate-50">
                    <div className="max-w-6xl mx-auto px-4 md:px-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10">About Our Clinic</h2>

                        {hasAboutImage ? (
                            <div className={`flex flex-col md:flex-row gap-10 items-center ${pd.about_image_position === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="clinic-content prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-strong:text-slate-800 prose-ul:text-slate-600 prose-ol:text-slate-600"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(pd.description_html!) }}
                                    />
                                </div>
                                <div className="w-full md:w-[45%] flex-shrink-0">
                                    <Image
                                        src={pd.about_image_url!}
                                        alt={`About ${org.name}`}
                                        width={600}
                                        height={400}
                                        className="w-full rounded-2xl shadow-lg object-cover max-h-[400px]"
                                        sizes="(max-width: 768px) 100vw, 45vw"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto">
                                <div
                                    className="clinic-content prose prose-lg prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-strong:text-slate-800 text-center"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(pd.description_html!) }}
                                />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ───── Services ───── */}
            {pd.services && pd.services.length > 0 && (
                <section className="py-16 md:py-20">
                    <div className="max-w-6xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Services</h2>
                            <p className="text-slate-500 mt-2">Comprehensive healthcare tailored to your needs</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pd.services.map((service, i) => {
                                const colors = [
                                    { bg: 'bg-blue-50', text: 'text-[#0077B6]', border: 'hover:border-blue-100' },
                                    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-100' },
                                    { bg: 'bg-violet-50', text: 'text-violet-600', border: 'hover:border-violet-100' },
                                    { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-100' },
                                    { bg: 'bg-rose-50', text: 'text-rose-600', border: 'hover:border-rose-100' },
                                    { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'hover:border-cyan-100' },
                                ]
                                const c = colors[i % colors.length]
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md ${c.border} transition-all`}
                                    >
                                        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                                            <CheckCircle size={18} className={c.text} />
                                        </div>
                                        <span className="font-medium text-slate-800">{service}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Gallery ───── */}
            {pd.gallery_images && pd.gallery_images.length > 0 && (
                <section className="py-16 md:py-20 bg-slate-50">
                    <div className="max-w-6xl mx-auto px-4 md:px-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10">Our Clinic</h2>
                        <div className={`grid gap-4 ${
                            pd.gallery_images.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto'
                            : pd.gallery_images.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}>
                            {pd.gallery_images.map((url, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden shadow-md border border-slate-100">
                                    <Image
                                        src={url}
                                        alt={`${org.name} gallery ${i + 1}`}
                                        width={400}
                                        height={256}
                                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
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
                <section className={`py-16 md:py-20 ${pd.gallery_images?.length ? '' : 'bg-slate-50'}`}>
                    <div className="max-w-6xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Meet Our Team</h2>
                            <p className="text-slate-500 mt-2">Experienced professionals dedicated to your health</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {doctors.map((doc: any) => {
                                const name = doc.profiles?.full_name || 'Doctor'
                                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                return (
                                    <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0077B6] to-[#0096c7] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                                            <span className="text-white font-bold text-xl">{initials}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900">{name}</h3>
                                        {doc.specialization && (
                                            <p className="text-sm text-[#0077B6] font-medium mt-1">{doc.specialization}</p>
                                        )}
                                        {doc.registration_number && (
                                            <p className="text-xs text-slate-400 mt-1">Reg: {doc.registration_number}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Working Hours ───── */}
            {pd.working_hours && (
                <section className="py-16 md:py-20">
                    <div className="max-w-md mx-auto px-4 md:px-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
                            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                <Clock size={24} className="text-amber-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Working Hours</h2>
                            <p className="text-slate-600 whitespace-pre-line">{pd.working_hours}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Contact ───── */}
            {(org.address || org.phone || org.email) && (
                <section className="py-16 md:py-20 bg-slate-50">
                    <div className="max-w-6xl mx-auto px-4 md:px-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10">Contact Us</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                            {org.address && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                        <MapPin size={20} className="text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 mb-1">Address</p>
                                    <p className="text-sm text-slate-500">{org.address}</p>
                                </div>
                            )}
                            {org.phone && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                        <Phone size={20} className="text-blue-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 mb-1">Phone</p>
                                    <a href={`tel:${org.phone}`} className="text-sm text-[#0077B6] hover:underline">{org.phone}</a>
                                </div>
                            )}
                            {org.email && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                                        <Mail size={20} className="text-purple-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 mb-1">Email</p>
                                    <a href={`mailto:${org.email}`} className="text-sm text-[#0077B6] hover:underline">{org.email}</a>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ───── Final CTA ───── */}
            <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-br from-[#0077B6] via-[#023e8a] to-[#0096c7]">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
                <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/20 rounded-full" />
                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white/15 rounded-full" />

                <div className="relative max-w-2xl mx-auto px-4 md:px-6 text-center text-white">
                    <h2 className="text-2xl md:text-3xl font-bold">Ready to Book Your Appointment?</h2>
                    <p className="text-blue-100 mt-3">Schedule your visit online in just a few clicks.</p>
                    <Link
                        href={`/book-online/${slug}`}
                        className="inline-flex items-center justify-center gap-2 h-12 px-8 mt-8 rounded-xl bg-white text-[#0077B6] font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                    >
                        Book Now <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* ───── Footer ───── */}
            <footer className="py-8 bg-slate-900 text-slate-400">
                <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm">
                    <p>&copy; {new Date().getFullYear()} {org.name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
