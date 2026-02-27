import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MedicineForm from './MedicineForm'

export default async function NewMedicinePage() {
    await requirePharmacyEnabled()

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center gap-3">
                <Link href="/pharmacy/medicines" className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Add Medicine</h1>
            </div>
            <MedicineForm />
        </div>
    )
}
