-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. Roles Enum
-- We drop type if exists to ensure clean slate or handle handle updates carefully in prod. 
-- For this script, we assume setup.
do $$ begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type user_role as enum ('superadmin', 'doctor', 'assistant');
    end if;
end $$;

-- 1. Profiles (Base User Table)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role not null default 'assistant',
  full_name text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Doctors Table (Extends Profile)
create table if not exists public.doctors (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  registration_number text,
  specialization text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Assistants Table (Extends Profile, Linked to Doctor)
create table if not exists public.assistants (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  assigned_doctor_id uuid references public.doctors(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Patients (Generic, not linked to Auth in strict B2B sense, but let's keep it flexible)
-- In this strict roles model, Patients might not log in. 
-- But user said "similar scope to DrPrax" (which had patients).
-- Let's keep patients as records managed by Doctor/Assistant.
create table if not exists public.patients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  dob date,
  gender text,
  address text,
  registration_number text unique, -- generated
  created_by_doctor_id uuid references public.doctors(id), -- optional tracking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Doctor Slots
create table if not exists public.doctor_slots (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.doctors(id) on delete cascade not null, -- Links to Doctors table
  day_of_week int not null,
  start_time time not null,
  end_time time not null,
  slot_duration int default 15,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (doctor_id, day_of_week, start_time)
);

-- 6. Appointments
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('booked', 'completed', 'cancelled')) default 'booked',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (doctor_id, start_time)
);

-- 7. Prescriptions
create table if not exists public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id),
  patient_id uuid references public.patients(id) not null,
  doctor_id uuid references public.doctors(id) not null,
  medications jsonb,
  history text,
  examinations text,
  diagnosis text,
  investigations text,
  advice text,
  follow_up_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Strict)

-- Helper: Get current user's role
-- Too slow for RLS? We can trust `auth.jwt() -> role` if we set custom claims, but standard is querying profiles.
-- To optimize, we focus on: "Assistant can access assigned doctor's data".

-- PROFILES
alter table public.profiles enable row level security;
create policy "View Profiles" on public.profiles for select using (
  auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'superadmin'
);
create policy "Update Self" on public.profiles for update using (auth.uid() = id);

-- DOCTORS
alter table public.doctors enable row level security;
create policy "View Doctors" on public.doctors for select using (true); -- Public read needed for booking? Or authenticated? Let's make it Authenticated.
-- Actually, assistants need to see their doctor. Superadmin sees all.
-- Doctors see themselves.
-- Let's allow "Authenticated" read for doctors table because it's directory info.
-- create policy "Read Doctors" on public.doctors for select to authenticated using (true);

-- ASSISTANTS
alter table public.assistants enable row level security;
create policy "Manage Assistants" on public.assistants for all using (
  (select role from public.profiles where id = auth.uid()) = 'superadmin'
);
create policy "View Assistants" on public.assistants for select using (
  profile_id = auth.uid() -- Self
  or
  assigned_doctor_id = (select id from public.doctors where profile_id = auth.uid()) -- My assistants
);

-- PATIENTS
alter table public.patients enable row level security;
create policy "Read Patients" on public.patients for select using (
  -- Superadmin
  (select role from public.profiles where id = auth.uid()) = 'superadmin'
  or
  -- Doctor
  exists (select 1 from public.doctors where profile_id = auth.uid()) -- Any doctor can see patients? Or strict ownership?
  -- Strict: Only if patient belongs to doctor? But patients roam?
  -- Let's allow Doctors to see all patients (Clinic mode).
  or
  -- Assistant
  exists (select 1 from public.assistants where profile_id = auth.uid())
);
-- Write Patients: Doctor or Assistant
create policy "Write Patients" on public.patients for all using (
  exists (select 1 from public.doctors where profile_id = auth.uid())
  or
  exists (select 1 from public.assistants where profile_id = auth.uid())
);

-- APPOINTMENTS
alter table public.appointments enable row level security;
create policy "Read Appointments" on public.appointments for select using (
  -- Superadmin
  (select role from public.profiles where id = auth.uid()) = 'superadmin'
  or
  -- Doctor (Own)
  doctor_id in (select id from public.doctors where profile_id = auth.uid())
  or
  -- Assistant (Assigned Doctor)
  doctor_id in (
    select assigned_doctor_id from public.assistants where profile_id = auth.uid()
  )
);
create policy "Manage Appointments" on public.appointments for all using (
   -- Doctor
  doctor_id in (select id from public.doctors where profile_id = auth.uid())
  or
  -- Assistant
  doctor_id in (
    select assigned_doctor_id from public.assistants where profile_id = auth.uid()
  )
);

-- SLOTS
alter table public.doctor_slots enable row level security;
-- Read: All authenticated (to book)
create policy "Read Slots" on public.doctor_slots for select to authenticated using (true);
-- Write: Doctor only
create policy "Manage Slots" on public.doctor_slots for all using (
  doctor_id in (select id from public.doctors where profile_id = auth.uid())
);

-- PRESCRIPTIONS
alter table public.prescriptions enable row level security;
create policy "Read Prescriptions" on public.prescriptions for select using (
  doctor_id in (select id from public.doctors where profile_id = auth.uid())
  or
  -- Assistant? Requirement: "Cannot access prescriptions"
  (select role from public.profiles where id = auth.uid()) = 'superadmin'
);
create policy "Write Prescriptions" on public.prescriptions for all using (
  doctor_id in (select id from public.doctors where profile_id = auth.uid())
);

-- Create Superadmin Trigger (Optional, usually manual seed needed)
-- We rely on Admin Create User Action which calls API.
