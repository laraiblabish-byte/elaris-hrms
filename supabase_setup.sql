-- ==============================================================================
-- ELARIS SOLUTIONS - HRMS & PAYROLL MANAGEMENT SYSTEM
-- Supabase Configuration, Table Creation, Predefined Departments & RLS Setup
-- ==============================================================================
-- Instructions: Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- It safely creates missing tables, enhances existing tables, and configures RLS.
-- ==============================================================================

-- 1. BASE TABLE DEFINITIONS (Created safely if they do not exist)

-- A. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT,
  department_id BIGINT,
  designation TEXT,
  salary NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B. Departments Table
CREATE TABLE IF NOT EXISTS public."Departments Table" (
  id BIGSERIAL PRIMARY KEY,
  department_name TEXT,
  name TEXT,
  description TEXT,
  head_employee_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- C. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Present',
  check_in TEXT DEFAULT '09:00',
  check_out TEXT DEFAULT '17:00',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- D. Leaves Table (with two-level approval workflow)
CREATE TABLE IF NOT EXISTS public.leaves (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  leave_type TEXT NOT NULL DEFAULT 'Annual Leave',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  head_approved BOOLEAN NOT NULL DEFAULT FALSE,
  final_approved BOOLEAN NOT NULL DEFAULT FALSE,
  head_action_at TIMESTAMPTZ,
  final_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- E. Payroll Table
CREATE TABLE IF NOT EXISTS public.payroll (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- F. Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  payroll_id BIGINT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- G. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'HR Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SCHEMA ENHANCEMENTS: Add missing columns if they do not exist
DO $$
BEGIN
  -- full_name on employees table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN full_name text;
  END IF;

  -- head_employee_id on "Departments Table"
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Departments Table' AND column_name = 'head_employee_id'
  ) THEN
    ALTER TABLE public."Departments Table" ADD COLUMN head_employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;

  -- Two-level leave approval columns on leaves table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'head_approved'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN head_approved BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'final_approved'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN final_approved BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'head_action_at'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN head_action_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'final_action_at'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN final_action_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. CREATE ALIAS VIEW FOR DEPARTMENTS (Convenience alias)
CREATE OR REPLACE VIEW public.departments AS 
SELECT * FROM public."Departments Table";

-- 3. INSERT 14 PREDEFINED DEPARTMENTS (Without Duplicates)
INSERT INTO public."Departments Table" (department_name, description)
SELECT d.name, d.desc
FROM (
  VALUES
    ('HR', 'Human resources management, talent acquisition, and personnel operations'),
    ('Software Development', 'Core software engineering, architecture, and backend systems'),
    ('Web Development', 'Full-stack web application development and cloud interfaces'),
    ('Mobile App Development', 'Native iOS, Android, and cross-platform mobile solutions'),
    ('AI & Machine Learning', 'Artificial intelligence, LLM systems, computer vision, and predictive models'),
    ('UI/UX Design', 'User interface, user experience, product design, and prototyping'),
    ('Quality Assurance', 'Software testing, automation testing, and quality engineering'),
    ('Finance & Accounts', 'Financial accounting, payroll administration, budgeting, and audits'),
    ('Marketing', 'Digital marketing, SEO, content strategy, brand growth, and communications'),
    ('Sales', 'Business development, client relationships, and enterprise sales'),
    ('IT Support', 'Internal infrastructure, network security, and technical helpdesk'),
    ('Administration', 'Office operations, facility management, and executive coordination'),
    ('Customer Support', 'Client success, technical customer support, and issue resolution'),
    ('Project Management', 'Agile project delivery, scrum leadership, and sprint coordination')
) AS d(name, desc)
WHERE NOT EXISTS (
  SELECT 1 FROM public."Departments Table" dt 
  WHERE LOWER(TRIM(dt.department_name)) = LOWER(TRIM(d.name))
);

-- 4. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'HR Admin')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Departments Table" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. PERMISSIVE RLS POLICIES (TO public: resolves all Error 42501 for all roles)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EMPLOYEES TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated insert on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated select on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated update on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated delete on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public insert on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public select on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public update on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public delete on employees" ON public.employees;

CREATE POLICY "Allow public insert on employees"
  ON public.employees FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on employees"
  ON public.employees FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on employees"
  ON public.employees FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on employees"
  ON public.employees FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- DEPARTMENTS TABLE POLICIES (Resolves error 42501 on department operations)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated insert on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated select on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated update on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated delete on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public insert on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public select on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public update on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public delete on departments" ON public."Departments Table";

CREATE POLICY "Allow public insert on departments"
  ON public."Departments Table" FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on departments"
  ON public."Departments Table" FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on departments"
  ON public."Departments Table" FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on departments"
  ON public."Departments Table" FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- PROFILES TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;

CREATE POLICY "Allow public insert on profiles"
  ON public.profiles FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on profiles"
  ON public.profiles FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on profiles"
  ON public.profiles FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- ATTENDANCE TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated select on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated update on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated delete on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public insert on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public select on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public update on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public delete on attendance" ON public.attendance;

CREATE POLICY "Allow public insert on attendance"
  ON public.attendance FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on attendance"
  ON public.attendance FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on attendance"
  ON public.attendance FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on attendance"
  ON public.attendance FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- LEAVES TABLE POLICIES (TWO-LEVEL APPROVAL WORKFLOW)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated insert on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated select on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated update on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated delete on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public insert on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public select on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public update on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public delete on leaves" ON public.leaves;

CREATE POLICY "Allow public insert on leaves"
  ON public.leaves FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on leaves"
  ON public.leaves FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on leaves"
  ON public.leaves FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on leaves"
  ON public.leaves FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- PAYROLL TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated insert on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated select on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated update on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated delete on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public insert on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public select on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public update on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public delete on payroll" ON public.payroll;

CREATE POLICY "Allow public insert on payroll"
  ON public.payroll FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on payroll"
  ON public.payroll FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on payroll"
  ON public.payroll FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on payroll"
  ON public.payroll FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- PAYSLIPS TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated insert on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated select on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated update on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated delete on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public insert on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public select on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public update on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public delete on payslips" ON public.payslips;

CREATE POLICY "Allow public insert on payslips"
  ON public.payslips FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on payslips"
  ON public.payslips FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on payslips"
  ON public.payslips FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on payslips"
  ON public.payslips FOR DELETE TO public USING (true);
