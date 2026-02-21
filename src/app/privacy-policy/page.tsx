import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicHeader />
            <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-slate-400 mb-8">Last updated: February 21, 2026</p>

                <div className="prose prose-slate max-w-none space-y-6 text-sm md:text-base leading-relaxed text-slate-600">
                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">1. Information We Collect</h2>
                        <p>When you use DrEase, we may collect the following types of information:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, gender, and address provided during account registration or appointment booking.</li>
                            <li><strong>Medical Information:</strong> Appointment details, prescription data, and patient records as entered by healthcare providers.</li>
                            <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, and interaction patterns to improve our services.</li>
                            <li><strong>Device Information:</strong> Operating system, device type, and screen resolution for optimizing your experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">2. How We Use Your Information</h2>
                        <p>We use collected information to:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Facilitate appointment booking and management between patients and healthcare providers.</li>
                            <li>Enable healthcare providers to create and manage digital prescriptions and patient records.</li>
                            <li>Send appointment confirmations, reminders, and important service notifications.</li>
                            <li>Improve and maintain the security and performance of our platform.</li>
                            <li>Respond to inquiries and provide customer support.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">3. Data Storage & Security</h2>
                        <p>
                            Your data is stored securely using industry-standard encryption and security measures. We use Supabase as our database provider, which employs row-level security, SSL encryption, and regular security audits. All data transmissions are encrypted using HTTPS/TLS protocols.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">4. Data Sharing</h2>
                        <p>We do not sell, rent, or trade your personal information to third parties. Your data may be shared only in the following circumstances:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li><strong>With your healthcare provider:</strong> Patient data is shared with the clinic/doctor you book appointments with.</li>
                            <li><strong>Service providers:</strong> We may use third-party services (hosting, analytics) that process data on our behalf under strict confidentiality agreements.</li>
                            <li><strong>Legal requirements:</strong> When required by law, court order, or governmental regulation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">5. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate or incomplete data.</li>
                            <li>Request deletion of your personal data, subject to legal and operational requirements.</li>
                            <li>Withdraw consent for data processing at any time.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">6. Cookies</h2>
                        <p>
                            DrEase uses essential cookies to maintain your session and ensure the platform functions correctly. We do not use third-party advertising cookies or tracking cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">7. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the revised policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">8. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy or your personal data, please contact us at{' '}
                            <a href="mailto:support@drease.in" className="text-[#0077B6] hover:underline">support@drease.in</a> or visit our{' '}
                            <Link href="/contact" className="text-[#0077B6] hover:underline">Contact page</Link>.
                        </p>
                    </section>
                </div>
            </div>
            <PublicFooter />
        </div>
    )
}
