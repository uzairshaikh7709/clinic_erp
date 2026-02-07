import Link from 'next/link'
import { ArrowRight, Check, Activity, Shield, Smartphone, Globe } from 'lucide-react'
import { getUserProfile } from '@/utils/auth'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

export default async function Home() {
  const profile = await getUserProfile()

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">

      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#0077B6] font-semibold text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0077B6]"></span>
              </span>
              #1 Choice for Orthopedics
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              Modernize Your <br />
              <span className="text-[#0077B6]">Medical Practice.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg">
              Simplifying healthcare with smart appointments, digital prescriptions, and secure patient records. Built for doctors who care.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login" className="btn btn-primary h-14 px-8 rounded-lg text-lg shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-transform">
                Get Started Free
              </Link>
              <Link href="/features" className="btn btn-secondary h-14 px-8 rounded-lg text-lg border-2 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50">
                Explore Features
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0077B6]" /> HIPAA Compliant</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0077B6]" /> 24/7 Support</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0077B6]" /> No Credit Card</span>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
            {/* Abstract UI Representation */}
            <div className="relative z-10 bg-white rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 p-2 transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="bg-slate-50 rounded-xl aspect-[4/3] flex items-center justify-center border border-slate-100 overflow-hidden">
                <div className="text-center space-y-2">
                  <Activity size={48} className="text-[#0077B6]/20 mx-auto" />
                  <p className="text-slate-400 font-medium">Dashboard Preview</p>
                </div>
              </div>
            </div>

            {/* Decor Elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>

        </div>
      </section>

      {/* Benefits / Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to run your clinic</h2>
            <p className="text-lg text-slate-500">Designed with direct input from leading physicians to streamline your daily workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard
              icon={Smartphone}
              title="Smart Appointments"
              desc="Automated reminders, easy rescheduling, and a clear daily view for your front desk."
            />
            <FeatureCard
              icon={Shield}
              title="Secure Records"
              desc="Bank-grade encryption ensures your patient data is safe and accessible only to authorized staff."
            />
            <FeatureCard
              icon={Globe}
              title="Digital Prescriptions"
              desc="Create compliant e-prescriptions in seconds. Send directly to pharmacies or print."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto bg-[#0077B6] rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">Ready to upgrade your clinic?</h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">Join thousands of doctors who trust OrthoClinic for their practice management.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login" className="btn bg-white text-[#0077B6] hover:bg-blue-50 px-8 h-14 rounded-lg font-bold text-lg border-none">
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
      <div className="w-14 h-14 rounded-xl bg-blue-50 text-[#0077B6] flex items-center justify-center mb-6">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}
