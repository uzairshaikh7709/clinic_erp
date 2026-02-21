-- Medical Certificates table
CREATE TABLE IF NOT EXISTS medical_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    age TEXT NOT NULL,
    sex TEXT NOT NULL DEFAULT 'Male',
    address TEXT,
    certificate_type TEXT NOT NULL DEFAULT 'Medical Certificate',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medical_certificates_doctor ON medical_certificates(doctor_id);
CREATE INDEX idx_medical_certificates_clinic ON medical_certificates(clinic_id);
CREATE INDEX idx_medical_certificates_date ON medical_certificates(date DESC);

-- RLS
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage their own certificates"
    ON medical_certificates FOR ALL
    USING (true)
    WITH CHECK (true);
