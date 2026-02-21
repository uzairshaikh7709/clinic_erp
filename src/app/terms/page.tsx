import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicHeader />
            <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
                <p className="text-sm text-slate-400 mb-8">Last updated: February 21, 2026</p>

                <div className="prose prose-slate max-w-none space-y-6 text-sm md:text-base leading-relaxed text-slate-600">
                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using DrEase (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform. These terms apply to all users, including patients, healthcare providers, clinic staff, and administrators.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">2. Description of Services</h2>
                        <p>DrEase provides a clinic management platform that enables:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Online appointment booking and scheduling for patients.</li>
                            <li>Patient record management for healthcare providers.</li>
                            <li>Digital prescription creation and management.</li>
                            <li>Clinic administration tools including staff and schedule management.</li>
                            <li>Multi-organization support for clinic networks.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">3. User Accounts</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You must provide accurate and complete information during registration.</li>
                            <li>You are responsible for all activities that occur under your account.</li>
                            <li>You must notify us immediately of any unauthorized use of your account.</li>
                            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">4. Healthcare Disclaimer</h2>
                        <p>
                            DrEase is a clinic management tool and does not provide medical advice, diagnosis, or treatment. The Platform facilitates communication between patients and healthcare providers but does not replace professional medical consultation. All medical decisions should be made by qualified healthcare professionals.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">5. Appointment Booking</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Online appointment bookings are subject to availability and confirmation by the healthcare provider.</li>
                            <li>Patients should arrive on time for scheduled appointments.</li>
                            <li>Cancellation policies are determined by individual clinics.</li>
                            <li>DrEase is not responsible for any issues arising from missed or cancelled appointments.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">6. Data & Privacy</h2>
                        <p>
                            Your use of the Platform is also governed by our{' '}
                            <Link href="/privacy-policy" className="text-[#0077B6] hover:underline">Privacy Policy</Link>.
                            Healthcare providers are responsible for complying with applicable healthcare data protection regulations in their jurisdiction when using the Platform to manage patient data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">7. Prohibited Use</h2>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Use the Platform for any unlawful purpose or in violation of any applicable laws.</li>
                            <li>Attempt to gain unauthorized access to other user accounts or system infrastructure.</li>
                            <li>Upload malicious code, viruses, or any harmful content.</li>
                            <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
                            <li>Scrape, harvest, or collect data from the Platform without authorization.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">8. Intellectual Property</h2>
                        <p>
                            All content, features, and functionality of DrEase, including but not limited to text, graphics, logos, icons, and software, are the exclusive property of DrEase and are protected by copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">9. Limitation of Liability</h2>
                        <p>
                            DrEase shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Platform. This includes, but is not limited to, damages for loss of data, revenue, or business opportunities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">10. Modifications</h2>
                        <p>
                            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on this page. Your continued use of the Platform after any modifications constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-3">11. Contact</h2>
                        <p>
                            For questions regarding these Terms and Conditions, please contact us at{' '}
                            <a href="mailto:sadik5780@gmail.com" className="text-[#0077B6] hover:underline">sadik5780@gmail.com</a> or visit our{' '}
                            <Link href="/contact" className="text-[#0077B6] hover:underline">Contact page</Link>.
                        </p>
                    </section>
                </div>
            </div>
            <PublicFooter />
        </div>
    )
}
