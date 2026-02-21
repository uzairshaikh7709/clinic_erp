import { getDoctorSlots } from './actions'
import SlotManager from './SlotManager'

export default async function SchedulePage() {
    let data = { doctorId: '', slots: [] as any[] }
    let error = ''

    try {
        data = await getDoctorSlots()
    } catch (e: any) {
        error = e.message
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">Error Loading Schedule</h1>
                <p className="text-slate-500">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-enter">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Schedule Settings</h1>
                <p className="text-slate-500">Manage your weekly availability and booking slots.</p>
            </div>

            <SlotManager doctorId={data.doctorId} initialSlots={data.slots} />
        </div>
    )
}
