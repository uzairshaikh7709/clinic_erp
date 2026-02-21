import { requireDoctorWithClinic } from '@/utils/auth'
import CertificateForm from '../CertificateForm'

export default async function NewCertificatePage() {
    await requireDoctorWithClinic()
    return <CertificateForm />
}
