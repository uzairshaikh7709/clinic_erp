-- ============================================================
-- Phase 2+3: Prescription-Pharmacy Integration, Invoicing, Audit
-- ============================================================

-- ── 1. ALTER existing tables ─────────────────────────────────

-- Dispensing status on prescriptions
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS dispensing_status text DEFAULT 'pending';

-- Add CHECK constraint separately (IF NOT EXISTS not supported for constraints)
DO $$ BEGIN
  ALTER TABLE public.prescriptions
    ADD CONSTRAINT chk_dispensing_status
    CHECK (dispensing_status IN ('pending', 'dispensed', 'partial', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- GST fields on medicines
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 12.00,
  ADD COLUMN IF NOT EXISTS hsn_code text;

-- Invoice counter on pharmacies
ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS next_invoice_number integer DEFAULT 1;

-- ── 2. CREATE new tables ─────────────────────────────────────

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    invoice_number text NOT NULL,
    patient_name text NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_name text,
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    discount numeric(12,2) NOT NULL DEFAULT 0,
    tax_total numeric(12,2) NOT NULL DEFAULT 0,
    grand_total numeric(12,2) NOT NULL DEFAULT 0,
    payment_status text NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
    notes text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(organization_id, invoice_number)
);

-- Invoice items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL,
    medicine_name text NOT NULL,
    batch_number text,
    expiry_date date,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL DEFAULT 0,
    gst_rate numeric(5,2) NOT NULL DEFAULT 0,
    line_total numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL DEFAULT 'cash'
        CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'other')),
    reference_number text,
    received_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Pharmacy audit logs
CREATE TABLE IF NOT EXISTS public.pharmacy_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb,
    performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 3. Indexes ───────────────────────────────────────────────

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_created ON public.invoices(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_prescription ON public.invoices(prescription_id) WHERE prescription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(organization_id, payment_status);

-- Invoice items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_medicine ON public.invoice_items(medicine_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON public.pharmacy_audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.pharmacy_audit_logs(entity_type, entity_id);

-- Prescriptions dispensing
CREATE INDEX IF NOT EXISTS idx_prescriptions_dispensing ON public.prescriptions(clinic_id, dispensing_status) WHERE dispensing_status = 'pending';

-- ── 4. RLS ───────────────────────────────────────────────────

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_audit_logs ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY invoices_select ON public.invoices FOR SELECT
    USING (organization_id = public.user_pharmacy_org_id());

CREATE POLICY invoices_insert ON public.invoices FOR INSERT
    WITH CHECK (organization_id = public.user_pharmacy_org_id());

CREATE POLICY invoices_update ON public.invoices FOR UPDATE
    USING (organization_id = public.user_pharmacy_org_id())
    WITH CHECK (organization_id = public.user_pharmacy_org_id());

-- Invoice items policies (read + append only)
CREATE POLICY invoice_items_select ON public.invoice_items FOR SELECT
    USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.user_pharmacy_org_id()));

CREATE POLICY invoice_items_insert ON public.invoice_items FOR INSERT
    WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.user_pharmacy_org_id()));

-- Payments policies (read + append only)
CREATE POLICY payments_select ON public.payments FOR SELECT
    USING (organization_id = public.user_pharmacy_org_id());

CREATE POLICY payments_insert ON public.payments FOR INSERT
    WITH CHECK (organization_id = public.user_pharmacy_org_id());

-- Audit logs policies (read only for users, insert via admin client)
CREATE POLICY audit_logs_select ON public.pharmacy_audit_logs FOR SELECT
    USING (organization_id = public.user_pharmacy_org_id());

-- ── 5. Invoice Number Generator (Atomic) ────────────────────

CREATE OR REPLACE FUNCTION public.generate_invoice_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _prefix text;
    _seq integer;
BEGIN
    UPDATE public.pharmacies
    SET next_invoice_number = next_invoice_number + 1
    WHERE organization_id = org_id
    RETURNING invoice_prefix, next_invoice_number - 1
    INTO _prefix, _seq;

    IF _prefix IS NULL THEN
        RAISE EXCEPTION 'Pharmacy config not found for org %', org_id;
    END IF;

    RETURN _prefix || '-' || LPAD(_seq::text, 4, '0');
END;
$$;
