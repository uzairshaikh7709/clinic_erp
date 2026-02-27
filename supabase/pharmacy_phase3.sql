-- ============================================================
-- Phase 3: Pharmacy Access Restructuring — org_type column
-- ============================================================

-- Add org_type to organizations (clinic = full clinic, pharmacy = pharmacy-only)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS org_type text NOT NULL DEFAULT 'clinic'
    CHECK (org_type IN ('clinic', 'pharmacy'));
