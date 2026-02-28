import { requirePharmacyEnabled } from '@/components/pharmacy/PharmacyGuard'
import SupplierForm from '../SupplierForm'

export default async function NewSupplierPage() {
    await requirePharmacyEnabled()

    return (
        <div className="space-y-6 animate-enter max-w-3xl">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Add Supplier</h1>
                <p className="text-slate-500 text-sm">Register a new medicine supplier</p>
            </div>
            <SupplierForm />
        </div>
    )
}
