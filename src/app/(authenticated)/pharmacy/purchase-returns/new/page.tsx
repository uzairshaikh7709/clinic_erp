import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import { getActiveSuppliers, getActiveMedicines } from '../../purchase-actions'
import PurchaseReturnForm from './PurchaseReturnForm'

export const dynamic = 'force-dynamic'

export default async function NewPurchaseReturnPage() {
    const { clinicId } = await requirePharmacyEnabled()

    const [suppliers, medicines] = await Promise.all([
        getActiveSuppliers(clinicId),
        getActiveMedicines(clinicId),
    ])

    return (
        <div className="space-y-6 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">New Purchase Return</h1>
                <p className="text-slate-500 text-sm">Return medicines to supplier against batch</p>
            </div>
            <PurchaseReturnForm suppliers={suppliers} medicines={medicines} />
        </div>
    )
}
