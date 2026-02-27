-- ============================================================
-- PHARMACY MODULE - Complete Schema Migration
-- Run this against your Supabase SQL editor
-- ============================================================

-- 1. Add pharmacy_enabled flag to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS pharmacy_enabled boolean DEFAULT false;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Pharmacies: 1:1 config per organization
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name text NOT NULL DEFAULT 'In-House Pharmacy',
    license_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Medicines: catalog per organization
CREATE TABLE IF NOT EXISTS public.medicines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    generic_name text,
    category text,
    manufacturer text,
    unit text NOT NULL DEFAULT 'pcs',
    low_stock_threshold integer NOT NULL DEFAULT 10,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Medicine Batches: batch-level stock with expiry tracking
CREATE TABLE IF NOT EXISTS public.medicine_batches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    batch_number text NOT NULL,
    expiry_date date NOT NULL,
    quantity_received integer NOT NULL DEFAULT 0,
    quantity_remaining integer NOT NULL DEFAULT 0,
    purchase_price numeric(10, 2),
    selling_price numeric(10, 2),
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT positive_quantity_remaining CHECK (quantity_remaining >= 0),
    CONSTRAINT positive_quantity_received CHECK (quantity_received >= 0)
);

-- Stock Movements: immutable audit trail
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    batch_id uuid REFERENCES public.medicine_batches(id) ON DELETE SET NULL,
    movement_type text NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'expired', 'returned')),
    quantity integer NOT NULL,
    reason text,
    performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- Medicines
CREATE INDEX IF NOT EXISTS idx_medicines_org_id ON public.medicines(organization_id);
CREATE INDEX IF NOT EXISTS idx_medicines_org_active ON public.medicines(organization_id, is_active);

-- Batches
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id ON public.medicine_batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_org_id ON public.medicine_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON public.medicine_batches(organization_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_org_expiry_remaining ON public.medicine_batches(organization_id, expiry_date)
    WHERE quantity_remaining > 0;

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_movements_org_id ON public.stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_movements_medicine_id ON public.stock_movements(medicine_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON public.stock_movements(organization_id, created_at DESC);

-- ============================================================
-- 4. RLS HELPER FUNCTION
-- ============================================================

-- Returns the user's org ID only if pharmacy_enabled = true
CREATE OR REPLACE FUNCTION public.user_pharmacy_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.clinic_id
    FROM public.profiles p
    INNER JOIN public.organizations o ON o.id = p.clinic_id
    WHERE p.id = auth.uid()
      AND o.pharmacy_enabled = true
      AND o.is_active = true
$$;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- PHARMACIES
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_select" ON public.pharmacies
    FOR SELECT USING (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "pharmacy_insert" ON public.pharmacies
    FOR INSERT WITH CHECK (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "pharmacy_update" ON public.pharmacies
    FOR UPDATE USING (organization_id = public.user_pharmacy_org_id());

-- MEDICINES
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicines_select" ON public.medicines
    FOR SELECT USING (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "medicines_insert" ON public.medicines
    FOR INSERT WITH CHECK (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "medicines_update" ON public.medicines
    FOR UPDATE USING (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "medicines_delete" ON public.medicines
    FOR DELETE USING (organization_id = public.user_pharmacy_org_id());

-- MEDICINE BATCHES
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches_select" ON public.medicine_batches
    FOR SELECT USING (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "batches_insert" ON public.medicine_batches
    FOR INSERT WITH CHECK (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "batches_update" ON public.medicine_batches
    FOR UPDATE USING (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "batches_delete" ON public.medicine_batches
    FOR DELETE USING (organization_id = public.user_pharmacy_org_id());

-- STOCK MOVEMENTS (append-only: no UPDATE or DELETE policies)
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movements_select" ON public.stock_movements
    FOR SELECT USING (organization_id = public.user_pharmacy_org_id());
CREATE POLICY "movements_insert" ON public.stock_movements
    FOR INSERT WITH CHECK (organization_id = public.user_pharmacy_org_id());

-- ============================================================
-- 6. RPC: Low Stock Aggregation
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_low_stock_medicines(org_id uuid)
RETURNS TABLE (
    medicine_id uuid,
    medicine_name text,
    generic_name text,
    category text,
    total_stock bigint,
    low_stock_threshold integer,
    unit text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.generic_name,
        m.category,
        COALESCE(SUM(b.quantity_remaining), 0) AS total_stock,
        m.low_stock_threshold,
        m.unit
    FROM public.medicines m
    LEFT JOIN public.medicine_batches b ON b.medicine_id = m.id AND b.quantity_remaining > 0
    WHERE m.organization_id = org_id
      AND m.is_active = true
    GROUP BY m.id, m.name, m.generic_name, m.category, m.low_stock_threshold, m.unit
    HAVING COALESCE(SUM(b.quantity_remaining), 0) < m.low_stock_threshold
    ORDER BY COALESCE(SUM(b.quantity_remaining), 0) ASC
$$;
