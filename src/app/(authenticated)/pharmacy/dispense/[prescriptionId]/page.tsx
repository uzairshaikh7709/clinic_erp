import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getDispensePreview } from '../../actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DispensePreview from './DispensePreview'

export default async function DispensePreviewPage({ params }: { params: Promise<{ prescriptionId: string }> }) {
    const { prescriptionId } = await params
    const { clinicId } = await requirePharmacyEnabled()

    const result = await getDispensePreview(clinicId, prescriptionId)

    if ('error' in result && result.error) {
        return (
            <div className="space-y-6 animate-enter">
                <Link href="/pharmacy/dispense" className="text-slate-400 hover:text-slate-700 flex items-center gap-2 text-sm">
                    <ArrowLeft size={16} /> Back to Dispense
                </Link>
                <div className="card p-8 text-center">
                    <p className="font-medium text-red-600">{result.error}</p>
                    <Link href="/pharmacy/dispense" className="text-indigo-600 hover:underline text-sm mt-3 inline-block">Go Back</Link>
                </div>
            </div>
        )
    }

    const { prescription, preview } = result as any

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex items-center gap-3">
                <Link href="/pharmacy/dispense" className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dispense Preview</h1>
                    <p className="text-slate-500 text-sm">
                        Patient: {(prescription.patients as any)?.full_name || 'Unknown'} &middot;{' '}
                        Dr. {(prescription.doctors as any)?.profiles?.full_name || '—'}
                    </p>
                </div>
            </div>

            <DispensePreview prescriptionId={prescriptionId} preview={preview} />
        </div>
    )
}
