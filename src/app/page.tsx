import Link from 'next/link'
import { ArrowRight, Check, Shield, Globe, Calendar, Users, Building2, FileText, UserPlus, Settings, Rocket } from 'lucide-react'
import { getUserProfile } from '@/utils/auth'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

export default async function Home() {
  const profile = await getUserProfile()

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">

      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-16 items-center">

          <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-blue-50 text-[#0077B6] font-semibold text-xs md:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0077B6]"></span>
              </span>
              #1 Choice for Doctors
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              Modernize Your <br />
              <span className="text-[#0077B6]">Medical Practice.</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-slate-500 leading-relaxed max-w-lg">
              Simplifying healthcare with smart appointments, digital prescriptions, and secure patient records. Built for doctors who care.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
              <Link href="/login" className="btn btn-primary h-12 md:h-14 px-6 md:px-8 rounded-lg text-base md:text-lg shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-transform justify-center">
                Get Started Free
              </Link>
              <Link href="#features" className="btn btn-secondary h-12 md:h-14 px-6 md:px-8 rounded-lg text-base md:text-lg border-2 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 justify-center">
                Explore Features
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 md:pt-4 text-xs md:text-sm font-medium text-slate-500">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0077B6]" /> HIPAA Compliant</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0077B6]" /> 24/7 Support</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0077B6]" /> No Credit Card</span>
            </div>
          </div>

          {/* Floating Glass Cards */}
          <div className="relative animate-enter hidden md:block h-[420px]">
            {/* Decorative blurred blobs */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            {/* Card 1: Appointments */}
            <div className="absolute top-4 right-4 lg:right-8 w-64 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.15)] p-5 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar size={20} className="text-[#0077B6]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Today&apos;s Appointments</p>
                  <p className="text-2xl font-bold text-slate-900">12</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex-1 h-1.5 rounded-full bg-blue-100">
                    <div className="h-full rounded-full bg-[#0077B6]" style={{ width: `${Math.random() * 40 + 60}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Patients */}
            <div className="absolute top-36 left-0 lg:left-4 w-56 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_-4px_rgba(16,185,129,0.15)] p-5 -rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Users size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Active Patients</p>
                  <p className="text-2xl font-bold text-slate-900">248</p>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowRight size={12} className="rotate-[-45deg]" /> +18% this month
              </p>
            </div>

            {/* Card 3: Prescriptions */}
            <div className="absolute bottom-4 right-8 lg:right-16 w-60 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_-4px_rgba(139,92,246,0.15)] p-5 rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <FileText size={20} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Prescriptions</p>
                  <p className="text-2xl font-bold text-slate-900">89</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: '72%' }} />
                </div>
                <span className="text-violet-600 font-semibold whitespace-nowrap">72%</span>
              </div>
            </div>

            {/* Small floating badge */}
            <div className="absolute top-48 right-2 lg:right-6 w-auto bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 shadow-lg px-3 py-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check size={12} className="text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Booking confirmed!</span>
            </div>
          </div>

        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-10 md:py-14 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: '500+', label: 'Doctors' },
              { value: '10,000+', label: 'Appointments' },
              { value: '50+', label: 'Clinics' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">Everything you need to run your clinic</h2>
            <p className="text-base md:text-lg text-slate-500">Designed with direct input from leading physicians to streamline your daily workflow.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={Calendar}
              title="Smart Appointments"
              desc="Automated reminders, easy rescheduling, and a clear daily view for your front desk."
              color="blue"
            />
            <FeatureCard
              icon={Shield}
              title="Secure Records"
              desc="Bank-grade encryption ensures your patient data is safe and accessible only to authorized staff."
              color="emerald"
            />
            <FeatureCard
              icon={FileText}
              title="Digital Prescriptions"
              desc="Create compliant e-prescriptions in seconds. Send directly to pharmacies or print."
              color="violet"
            />
            <FeatureCard
              icon={Globe}
              title="Online Booking"
              desc="Let patients book 24/7 from your custom clinic page. No phone calls needed."
              color="amber"
            />
            <FeatureCard
              icon={Users}
              title="Role-Based Access"
              desc="Doctors, assistants, and admins with tailored dashboards and permissions."
              color="rose"
            />
            <FeatureCard
              icon={Building2}
              title="Multi-Clinic"
              desc="Manage multiple locations from one account. Centralized control, local flexibility."
              color="cyan"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">Get started in minutes</h2>
            <p className="text-base md:text-lg text-slate-500">Three simple steps to transform your practice.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />

            <StepCard
              number={1}
              icon={UserPlus}
              title="Sign Up"
              desc="Create your clinic account in minutes. No credit card required."
            />
            <StepCard
              number={2}
              icon={Settings}
              title="Configure"
              desc="Set up doctors, schedules, services, and your public clinic page."
            />
            <StepCard
              number={3}
              icon={Rocket}
              title="Go Live"
              desc="Start accepting online bookings and managing patients instantly."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#0077B6] via-[#023e8a] to-[#0096c7] rounded-2xl md:rounded-3xl p-8 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/20 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white/15 rounded-full" />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full" />

          <div className="relative z-10 space-y-6 md:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">Ready to upgrade your clinic?</h2>
            <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto">Join thousands of doctors who trust DrEase for their practice management.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login" className="btn bg-white text-[#0077B6] hover:bg-blue-50 px-6 md:px-8 h-12 md:h-14 rounded-lg font-bold text-base md:text-lg border-none justify-center">
                Get Started Now
              </Link>
              <Link href="/contact" className="btn border-2 border-white/30 text-white hover:bg-white/10 px-6 md:px-8 h-12 md:h-14 rounded-lg font-bold text-base md:text-lg justify-center">
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

const COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#0077B6]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  const c = COLORS[color] || COLORS.blue
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-4 md:mb-6`}>
        <Icon size={24} className="md:hidden" />
        <Icon size={28} className="hidden md:block" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm md:text-base">{desc}</p>
    </div>
  )
}

function StepCard({ number, icon: Icon, title, desc }: { number: number; icon: any; title: string; desc: string }) {
  return (
    <div className="text-center relative">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#0077B6] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 relative z-10">
        <Icon size={24} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <span className="inline-block text-xs font-bold text-[#0077B6] bg-blue-50 px-2.5 py-1 rounded-full mb-3">Step {number}</span>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
