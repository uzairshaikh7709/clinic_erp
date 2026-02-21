import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Clock } from 'lucide-react'
import ContactForm from './ContactForm'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicHeader />
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-16">
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="text-center mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Get in Touch</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">Have questions about DrEase? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0077B6] flex items-center justify-center flex-shrink-0">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">Email</p>
                                    <a href="mailto:sadik5780@gmail.com" className="text-sm text-[#0077B6] hover:underline">
                                        support@drease.in
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">Response Time</p>
                                    <p className="text-sm text-slate-500">Within 24 hours</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">Location</p>
                                    <p className="text-sm text-slate-500">India</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-2">
                        <ContactForm />
                    </div>
                </div>
            </div>
            <PublicFooter />
        </div>
    )
}
